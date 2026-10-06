import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  coversExpenses,
  formatMonthName,
  monthDayRange,
  summarizeFinance,
  toMonthKey,
} from "@/lib/finance";
import { startOfDayInStoreTime } from "@/lib/store-time";
import { COUNTED_STATUSES } from "@/services/best-seller-service";
import * as notificationService from "@/services/notification-service";
import type { ExpenseData } from "@/validations/expense";

export function listExpenses(monthKey: string) {
  const { start, end } = monthDayRange(monthKey);
  return prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });
}

/** Faturamento do mês com o mesmo critério da visão geral: pedidos aceitos, pelo dia em que foram feitos. */
async function getMonthRevenue(monthKey: string): Promise<{ revenue: number; orders: number }> {
  const { start, end } = monthDayRange(monthKey);
  const result = await prisma.order.aggregate({
    where: {
      status: { in: COUNTED_STATUSES },
      createdAt: { gte: startOfDayInStoreTime(start), lt: startOfDayInStoreTime(end) },
    },
    _sum: { total: true },
    _count: { _all: true },
  });
  return {
    revenue: Number(result._sum.total?.toString() ?? 0),
    orders: result._count._all,
  };
}

export async function getFinanceMonth(monthKey: string) {
  const [{ revenue, orders }, expenses] = await Promise.all([
    getMonthRevenue(monthKey),
    listExpenses(monthKey),
  ]);
  const summary = summarizeFinance(
    revenue,
    expenses.map((expense) => ({ category: expense.category, amount: Number(expense.amount) })),
  );
  return { summary, orders, expenses };
}

export type FinanceMonth = Awaited<ReturnType<typeof getFinanceMonth>>;

export function createExpense(data: ExpenseData, createdById: string) {
  return prisma.expense.create({ data: { ...data, createdById } });
}

export async function updateExpense(expenseId: string, data: ExpenseData) {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new NotFoundError("Despesa não encontrada.");
  return prisma.expense.update({ where: { id: expenseId }, data });
}

export async function deleteExpense(expenseId: string) {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) throw new NotFoundError("Despesa não encontrada.");
  return prisma.expense.delete({ where: { id: expenseId } });
}

/**
 * Registra o aviso do mês de forma atômica e diz se este processo deve enviá-lo.
 * Só grava se ainda não houve aviso ou se o total de despesas cresceu desde o
 * último — dois pedidos confirmados ao mesmo tempo não disparam dois e-mails, e
 * um cancelamento seguido de nova venda não repete o aviso.
 */
async function claimBreakEvenNotice(monthKey: string, expensesTotal: number): Promise<boolean> {
  const affected = await prisma.$executeRaw`
    INSERT INTO "BreakEvenNotice" ("month", "expensesTotal", "sentAt")
    VALUES (${monthKey}, CAST(${expensesTotal.toFixed(2)} AS DECIMAL(10, 2)), NOW())
    ON CONFLICT ("month") DO UPDATE
    SET "expensesTotal" = EXCLUDED."expensesTotal", "sentAt" = EXCLUDED."sentAt"
    WHERE "BreakEvenNotice"."expensesTotal" < EXCLUDED."expensesTotal"
  `;
  return affected > 0;
}

/**
 * Confere se o faturamento do mês corrente já cobriu as despesas e avisa os
 * Proprietários por e-mail (uma vez por total de despesas). Chamado depois de um
 * pedido passar a contar como venda e depois de mudanças nas despesas. Nunca
 * lança: o aviso não pode derrubar a confirmação de um pedido nem o cadastro.
 */
export async function checkBreakEven(now = new Date()): Promise<void> {
  try {
    const monthKey = toMonthKey(now);
    const { summary } = await getFinanceMonth(monthKey);
    if (!coversExpenses(summary)) return;
    if (!(await claimBreakEvenNotice(monthKey, summary.expenses))) return;

    const owners = await prisma.user.findMany({
      where: { role: "OWNER" },
      select: { name: true, email: true },
    });
    await notificationService.sendBreakEvenEmail(owners, {
      month: monthKey,
      monthName: formatMonthName(monthKey),
      revenue: summary.revenue,
      expenses: summary.expenses,
      result: summary.result,
    });
  } catch (error) {
    console.error("Falha ao verificar o ponto de equilíbrio do mês:", error);
  }
}
