import type { ExpenseCategory } from "@/generated/prisma/client";
import { toDayKey } from "@/lib/store-time";

/**
 * Regras do painel financeiro (despesas x faturamento). Sem Prisma: a página, o
 * formulário e os testes usam as mesmas funções. Valores somados em centavos.
 */
export const EXPENSE_CATEGORIES = [
  "MATERIAL",
  "EMBALAGEM",
  "ENTREGA",
  "EQUIPAMENTO",
  "MARKETING",
  "OUTROS",
] as const satisfies readonly ExpenseCategory[];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MATERIAL: "Material",
  EMBALAGEM: "Embalagem",
  ENTREGA: "Entrega",
  EQUIPAMENTO: "Equipamento",
  MARKETING: "Marketing",
  OUTROS: "Outros",
};

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Mês (YYYY-MM) em que o instante cai no fuso da loja. */
export function toMonthKey(date: Date): string {
  return toDayKey(date).slice(0, 7);
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_KEY.test(value);
}

/** Soma meses a uma chave YYYY-MM ("2026-01", -1 → "2025-12"). */
export function addMonths(monthKey: string, months: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Primeiro dia do mês e primeiro dia do mês seguinte (fim exclusivo), como YYYY-MM-DD. */
export function monthDayRange(monthKey: string): { start: string; end: string } {
  return { start: `${monthKey}-01`, end: `${addMonths(monthKey, 1)}-01` };
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10" → "outubro de 2026" (a chave já está no fuso da loja). */
export function formatMonthLabel(monthKey: string): string {
  return monthFormatter.format(new Date(`${monthKey}-15T12:00:00Z`));
}

/** "2026-10" → "outubro". */
export function formatMonthName(monthKey: string): string {
  return formatMonthLabel(monthKey).split(" de ")[0];
}

export type CategoryTotal = { category: ExpenseCategory; total: number; count: number };

export type FinanceSummary = {
  revenue: number;
  expenses: number;
  /** Faturamento − despesas (negativo = prejuízo). */
  result: number;
  /** Quanto das despesas o faturamento já cobriu, de 0 a 1 (null sem despesas). */
  coverage: number | null;
  byCategory: CategoryTotal[];
};

export function summarizeFinance(
  revenue: number,
  expenses: Array<{ category: ExpenseCategory; amount: number }>,
): FinanceSummary {
  const revenueCents = Math.round(revenue * 100);
  const byCategory = new Map<ExpenseCategory, { cents: number; count: number }>();
  let expensesCents = 0;

  for (const expense of expenses) {
    const cents = Math.round(expense.amount * 100);
    expensesCents += cents;
    const bucket = byCategory.get(expense.category) ?? { cents: 0, count: 0 };
    bucket.cents += cents;
    bucket.count += 1;
    byCategory.set(expense.category, bucket);
  }

  return {
    revenue: revenueCents / 100,
    expenses: expensesCents / 100,
    result: (revenueCents - expensesCents) / 100,
    coverage: expensesCents > 0 ? Math.min(revenueCents / expensesCents, 1) : null,
    byCategory: [...byCategory.entries()]
      .map(([category, bucket]) => ({ category, total: bucket.cents / 100, count: bucket.count }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category)),
  };
}

/** O faturamento cobriu as despesas — só faz sentido avisar se houver despesa cadastrada. */
export function coversExpenses(summary: Pick<FinanceSummary, "revenue" | "expenses">): boolean {
  return summary.expenses > 0 && summary.revenue >= summary.expenses;
}
