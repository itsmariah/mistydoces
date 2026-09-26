import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";
import { STATUS_LABELS } from "@/components/orders/order-status-badge";
import { cn } from "@/lib/utils";

export function OpenOrders({ counts }: { counts: Array<{ status: OrderStatus; count: number }> }) {
  const total = counts.reduce((sum, { count }) => sum + count, 0);

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Pedidos em aberto</h2>
        <span className="text-sm text-muted-foreground">
          {total === 0 ? "Nenhum pedido em aberto" : `${total} no total`}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {counts.map(({ status, count }) => (
          <li key={status}>
            <Link
              href={`/admin/pedidos?status=${status}`}
              className={cn(
                "flex h-full flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted",
                count > 0 ? "border-link/40" : "border-border",
              )}
            >
              <span
                className={cn(
                  "text-2xl font-semibold",
                  count === 0 && "text-muted-foreground",
                )}
              >
                {count}
              </span>
              <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
