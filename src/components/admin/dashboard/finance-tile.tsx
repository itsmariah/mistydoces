import { Wallet } from "lucide-react";
import { formatMonthName, type FinanceSummary } from "@/lib/finance";
import { cn, formatCurrency } from "@/lib/utils";
import { StatTile } from "@/components/admin/dashboard/stat-tile";
import { CountUp } from "@/components/admin/count-up";

/** Resumo do Financeiro na visão geral (só Proprietário): quanto das despesas do mês já foi pago. */
export function FinanceTile({ summary, month }: { summary: FinanceSummary; month: string }) {
  const monthName = formatMonthName(month);

  if (summary.coverage === null) {
    return (
      <StatTile
        icon={Wallet}
        label={`Despesas de ${monthName}`}
        value="—"
        detail="Cadastre as despesas do mês para comparar com o faturamento."
        href={`/admin/financeiro?mes=${month}`}
      />
    );
  }

  const percent = Math.floor(summary.coverage * 100);
  const covered = summary.coverage >= 1;

  return (
    <StatTile
      icon={Wallet}
      label={`Despesas de ${monthName}`}
      value={
        <>
          <CountUp value={percent} />% cobertas
        </>
      }
      detail={
        covered
          ? `Sobra de ${formatCurrency(summary.result)} até agora`
          : `Faltam ${formatCurrency(-summary.result)} de faturamento`
      }
      href={`/admin/financeiro?mes=${month}`}
    >
      <div
        role="progressbar"
        aria-label="Despesas do mês cobertas pelo faturamento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full animate-bar-fill rounded-full", covered ? "bg-success-foreground" : "bg-chart-1")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </StatTile>
  );
}
