import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Printer, Store, Truck } from "lucide-react";
import { requirePagePermission } from "@/lib/require-permission";
import { formatSlotRange } from "@/lib/scheduling";
import { relativeDayLabel } from "@/lib/store-hours";
import { minutesOfDay } from "@/lib/store-time";
import { AGENDA_DAYS, getAgenda } from "@/services/agenda-service";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { summarizeOrderItems } from "@/components/orders/order-item-thumbnails";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Agenda" };

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function dayTitle(dayKey: string, now: Date) {
  const date = dayFormatter.format(new Date(`${dayKey}T12:00:00Z`));
  const relative = relativeDayLabel(dayKey, now);
  return relative === "hoje" || relative === "amanhã"
    ? { kicker: relative === "hoje" ? "Hoje" : "Amanhã", date }
    : { kicker: null, date };
}

/**
 * O que a cozinha tem pela frente: pedidos agendados dos próximos dias, por janela, e o
 * total a produzir em cada dia. Cancelados ficam de fora.
 */
export default async function AgendaPage() {
  await requirePagePermission("orders:view");
  // "Hoje" depende do momento da requisição — nunca pode sair do prerender.
  await connection();
  const now = new Date();
  const days = await getAgenda(now);
  const totalOrders = days.reduce((sum, day) => sum + day.orders.length, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          {totalOrders === 0
            ? `Nenhum pedido agendado nos próximos ${AGENDA_DAYS} dias.`
            : `${totalOrders} ${totalOrders === 1 ? "pedido agendado" : "pedidos agendados"} nos próximos ${AGENDA_DAYS} dias.`}
        </p>
      </div>

      {days.map((day) => {
        const title = dayTitle(day.dayKey, now);
        return (
          <section
            key={day.dayKey}
            aria-labelledby={`dia-${day.dayKey}`}
            className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`dia-${day.dayKey}`} className="font-heading text-lg font-semibold">
                {title.kicker && <span className="text-link">{title.kicker} · </span>}
                <span className={title.kicker ? "font-normal text-muted-foreground" : "first-letter:uppercase"}>
                  {title.date}
                </span>
              </h2>
              <span className="shrink-0 text-sm text-muted-foreground">
                {day.orders.length === 0
                  ? "Sem pedidos"
                  : `${day.orders.length} ${day.orders.length === 1 ? "pedido" : "pedidos"}`}
              </span>
            </div>

            {day.production.length > 0 && (
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Produzir no dia
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {day.production.map((line) => (
                    <li
                      key={`${line.productName}-${line.variantLabel}`}
                      className="rounded-full bg-background px-2.5 py-1 text-sm"
                    >
                      <span className="font-semibold">{line.quantity}x</span> {line.productName}{" "}
                      <span className="text-muted-foreground">({line.variantLabel})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {day.orders.length > 0 && (
              <ul className="divide-y divide-border">
                {day.orders.map((order) => (
                  <li key={order.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                    <span className="w-20 shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
                      {formatSlotRange(minutesOfDay(order.scheduledFor))}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        #{order.orderNumber} — {order.customerName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {summarizeOrderItems(
                          order.items.map((item) => `${item.quantity}x ${item.productNameSnapshot}`),
                          3,
                        )}
                      </p>
                      {order.items
                        .filter((item) => item.note)
                        .map((item, index) => (
                          <p key={index} className="text-xs font-medium text-secondary-foreground">
                            ✎ {item.productNameSnapshot}: &ldquo;{item.note}&rdquo;
                          </p>
                        ))}
                      {order.notes && (
                        <p className="text-xs text-muted-foreground">Obs.: {order.notes}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">
                          {order.deliveryType === "DELIVERY" ? (
                            <Truck className="h-3 w-3" />
                          ) : (
                            <Store className="h-3 w-3" />
                          )}
                          {order.deliveryType === "DELIVERY"
                            ? `Entrega${order.deliveryNeighborhood ? ` · ${order.deliveryNeighborhood}` : ""}`
                            : "Retirada"}
                        </Badge>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    <Link
                      href={`/admin/pedidos/${order.id}/imprimir`}
                      aria-label={`Imprimir pedido #${order.orderNumber}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Printer className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
