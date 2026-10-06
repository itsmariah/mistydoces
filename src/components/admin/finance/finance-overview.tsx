import { CircleCheck } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS, type FinanceSummary } from "@/lib/finance";
import { cn, formatCurrency, pluralize } from "@/lib/utils";

function StatCard({
  title,
  value,
  detail,
  valueClassName,
}: {
  title: string;
  value: string;
  detail: string;
  valueClassName?: string;
}) {
  return (
    <section className="space-y-2 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <p className={cn("font-heading text-2xl font-semibold tabular-nums", valueClassName)}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}

export function FinanceCards({
  summary,
  orders,
  expenseCount,
}: {
  summary: FinanceSummary;
  orders: number;
  expenseCount: number;
}) {
  const profit = summary.result >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Faturamento"
        value={formatCurrency(summary.revenue)}
        detail={pluralize(orders, "pedido", "pedidos")}
      />
      <StatCard
        title="Despesas"
        value={formatCurrency(summary.expenses)}
        detail={pluralize(expenseCount, "despesa", "despesas")}
      />
      <StatCard
        title={profit ? "Lucro" : "Prejuízo"}
        value={formatCurrency(Math.abs(summary.result))}
        detail="Faturamento − despesas"
        valueClassName={profit ? "text-success-foreground" : "text-destructive"}
      />
    </div>
  );
}

/** Barra "quanto das despesas o faturamento já pagou" — o mesmo critério do aviso por e-mail. */
export function BreakEvenProgress({ summary }: { summary: FinanceSummary }) {
  if (summary.coverage === null) return null;

  const covered = summary.coverage >= 1;
  const percent = Math.floor(summary.coverage * 100);

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Despesas cobertas</h2>
        <span className="text-sm font-medium tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Despesas cobertas pelo faturamento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-3 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", covered ? "bg-success-foreground" : "bg-chart-1")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {covered ? (
          <>
            <CircleCheck className="h-4 w-4 shrink-0 text-success-foreground" aria-hidden="true" />
            Despesas cobertas! Sobra de {formatCurrency(summary.result)} até agora.
          </>
        ) : (
          <>Faltam {formatCurrency(-summary.result)} de faturamento para cobrir as despesas.</>
        )}
      </p>
    </section>
  );
}

export function ExpensesByCategory({ summary }: { summary: FinanceSummary }) {
  if (summary.byCategory.length === 0) return null;
  const max = summary.byCategory[0].total;

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">Por categoria</h2>
      <ul className="space-y-3">
        {summary.byCategory.map((item) => (
          <li key={item.category} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{EXPENSE_CATEGORY_LABELS[item.category]}</span>
              <span className="tabular-nums">
                {formatCurrency(item.total)}
                <span className="ml-2 text-muted-foreground">
                  {Math.round((item.total / summary.expenses) * 100)}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${Math.max((item.total / max) * 100, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
