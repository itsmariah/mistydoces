import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/client";
import { STATUS_LABELS } from "@/components/orders/order-status-badge";
import { cn } from "@/lib/utils";

/**
 * Pedidos em aberto como a esteira real do pedido (aguardando → … → saiu para entrega).
 * "Aguardando confirmação" é o único que depende de uma ação da loja para andar,
 * então ganha destaque quando tem pedido; status zerados ficam discretos.
 */
export function OpenOrders({ counts }: { counts: Array<{ status: OrderStatus; count: number }> }) {
  const total = counts.reduce((sum, { count }) => sum + count, 0);

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Pedidos em aberto</h2>
        <span className="text-sm text-muted-foreground">
          {total === 0 ? "Tudo em dia" : `${total} no total`}
        </span>
      </div>

      <div className="relative">
        {/* Trilho da esteira, atrás dos marcadores. */}
        <span
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-[13px] w-px -translate-x-1/2 bg-border"
        />
        <ol className="relative space-y-1">
        {counts.map(({ status, count }) => {
          const needsAction = status === "PENDING" && count > 0;
          return (
            <li key={status} className="relative">
              <Link
                href={`/admin/pedidos?status=${status}`}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted",
                  needsAction && "bg-warning hover:bg-warning",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative size-2.5 shrink-0 rounded-full border-2 border-card ring-1",
                    needsAction
                      ? "bg-warning-foreground ring-warning-foreground"
                      : count > 0
                        ? "bg-link ring-link"
                        : "bg-card ring-border",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    needsAction && "font-medium text-warning-foreground",
                    count === 0 && "text-muted-foreground",
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span
                  className={cn(
                    "min-w-7 rounded-full px-2 py-0.5 text-center text-sm font-semibold tabular-nums",
                    needsAction
                      ? "bg-warning-foreground text-warning"
                      : count > 0
                        ? "bg-primary/25 text-link"
                        : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
        </ol>
      </div>
    </section>
  );
}
