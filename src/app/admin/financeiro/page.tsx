import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePagePermission } from "@/lib/require-permission";
import { addMonths, formatMonthLabel, isMonthKey, toMonthKey } from "@/lib/finance";
import { toDayKey } from "@/lib/store-time";
import { cn } from "@/lib/utils";
import { getFinanceMonth } from "@/services/finance-service";
import {
  BreakEvenProgress,
  ExpensesByCategory,
  FinanceCards,
} from "@/components/admin/finance/finance-overview";
import { ExpenseList } from "@/components/admin/finance/expense-list";

const NAV_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requirePagePermission("finance:manage");
  // O mês atual depende do momento da requisição.
  await connection();
  const now = new Date();
  const currentMonth = toMonthKey(now);
  const { mes } = await searchParams;
  // Mês inválido ou futuro cai no mês atual: não há o que comparar adiante.
  const month = isMonthKey(mes) && mes <= currentMonth ? mes : currentMonth;
  const isCurrentMonth = month === currentMonth;
  const monthLabel = formatMonthLabel(month);

  const { summary, orders, expenses } = await getFinanceMonth(month);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Faturamento x despesas, sem pedidos pendentes ou cancelados
          </p>
        </div>

        <nav aria-label="Mês" className="flex items-center gap-2">
          <Link
            href={`/admin/financeiro?mes=${addMonths(month, -1)}`}
            className={cn(NAV_CLASS, "hover:bg-muted")}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mês anterior</span>
          </Link>
          <span className="min-w-36 text-center text-sm font-medium first-letter:uppercase">
            {monthLabel}
          </span>
          {isCurrentMonth ? (
            <span aria-hidden="true" className={cn(NAV_CLASS, "opacity-40")}>
              <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <Link
              href={`/admin/financeiro?mes=${addMonths(month, 1)}`}
              className={cn(NAV_CLASS, "hover:bg-muted")}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próximo mês</span>
            </Link>
          )}
        </nav>
      </div>

      <FinanceCards summary={summary} orders={orders} expenseCount={expenses.length} />
      <BreakEvenProgress summary={summary} />
      <ExpensesByCategory summary={summary} />

      <ExpenseList
        // Remonta ao trocar de mês: fecha formulários abertos do mês anterior.
        key={month}
        monthLabel={monthLabel}
        defaultDate={isCurrentMonth ? toDayKey(now) : `${month}-01`}
        expenses={expenses.map((expense) => ({
          id: expense.id,
          title: expense.title,
          category: expense.category,
          amount: Number(expense.amount),
          date: expense.date,
          createdByName: expense.createdBy?.name ?? null,
        }))}
      />

      {isCurrentMonth && (
        <p className="text-xs text-muted-foreground">
          Quando o faturamento do mês cobrir as despesas, os Proprietários recebem um aviso por
          e-mail.
        </p>
      )}
    </div>
  );
}
