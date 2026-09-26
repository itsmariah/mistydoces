import type { SalesSummary } from "@/services/dashboard-service";
import { formatCurrency } from "@/lib/utils";

export function SalesSummaryCard({ title, summary }: { title: string; summary: SalesSummary }) {
  const ordersLabel = summary.orders === 1 ? "1 pedido" : `${summary.orders} pedidos`;

  return (
    <section className="space-y-2 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <p className="font-heading text-3xl font-semibold">{formatCurrency(summary.revenue)}</p>
      <p className="text-sm text-muted-foreground">
        {ordersLabel}
        {summary.orders > 0 && <> · ticket médio {formatCurrency(summary.averageTicket)}</>}
      </p>
    </section>
  );
}
