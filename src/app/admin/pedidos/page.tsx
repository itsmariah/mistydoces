import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Store, Truck } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/client";
import { requirePagePermission } from "@/lib/require-permission";
import { adminListOrders } from "@/services/order-service";
import { parsePage } from "@/lib/pagination";
import { PAYMENT_STATUS_LABELS } from "@/lib/payment-labels";
import { OrderStatusBadge, STATUS_LABELS } from "@/components/orders/order-status-badge";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

const STATUS_FILTERS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

type OrdersQuery = { status?: OrderStatus; busca?: string; pagina?: number };

/** Monta a URL da lista mantendo filtro, busca e página juntos. */
function ordersHref({ status, busca, pagina }: OrdersQuery) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (busca) params.set("busca", busca);
  if (pagina && pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
}

const chipClass = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
    active ? "border-link bg-primary/10 text-link" : "border-border hover:bg-muted",
  );

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; busca?: string; pagina?: string }>;
}) {
  await requirePagePermission("orders:view");
  const params = await searchParams;
  const activeStatus = STATUS_FILTERS.find((s) => s === params.status);
  const busca = params.busca?.trim() || undefined;
  const page = parsePage(params.pagina);

  const { orders, total, totalPages, statusCounts, allCount } = await adminListOrders({
    status: activeStatus,
    search: busca,
    page,
  });

  // Página além do fim (ex.: link antigo depois de filtrar) volta para a última que existe.
  if (page > totalPages) redirect(ordersHref({ status: activeStatus, busca, pagina: totalPages }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Pedidos</h1>

      {/* GET simples: a busca vai para a URL e funciona até sem JavaScript. */}
      <form action="/admin/pedidos" className="flex gap-2" role="search">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <Input
          name="busca"
          type="search"
          defaultValue={busca}
          placeholder="Buscar por nº do pedido, nome ou e-mail"
          aria-label="Buscar pedidos"
        />
        <Button type="submit" variant="outline">
          <Search /> Buscar
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={ordersHref({ busca })} className={chipClass(!activeStatus)}>
          Todos <span className="text-xs text-muted-foreground">{allCount}</span>
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={ordersHref({ status: s, busca })} className={chipClass(activeStatus === s)}>
            {STATUS_LABELS[s]}
            <span className="text-xs text-muted-foreground">{statusCounts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {busca && (
        <p className="text-sm text-muted-foreground">
          {total} resultado(s) para &ldquo;{busca}&rdquo; ·{" "}
          <Link href={ordersHref({ status: activeStatus })} className="text-link hover:underline">
            Limpar busca
          </Link>
        </p>
      )}

      <div className="space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            image={{ src: "/branding/02_gatinha_dormindo.png", width: 146, height: 120 }}
            title={activeStatus || busca ? "Nenhum pedido aqui" : "Nenhum pedido ainda"}
            description={
              busca
                ? "Nenhum pedido encontrado para essa busca."
                : activeStatus
                  ? `Não há pedidos com o status "${STATUS_LABELS[activeStatus]}" no momento.`
                  : "Quando clientes fizerem pedidos pelo site, eles aparecem aqui."
            }
          />
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 space-y-1.5">
                <p className="truncate text-sm font-medium">
                  Pedido #{order.orderNumber} — {order.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    {order.deliveryType === "DELIVERY" ? (
                      <Truck className="h-3 w-3" />
                    ) : (
                      <Store className="h-3 w-3" />
                    )}
                    {order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada"}
                  </Badge>
                  {order.payment && (
                    <Badge variant={order.payment.status === "PAID" ? "secondary" : "outline"}>
                      {order.payment.status === "PAID"
                        ? "Pago"
                        : `Pagamento: ${PAYMENT_STATUS_LABELS[order.payment.status].toLowerCase()}`}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm font-semibold text-link">
                  {formatCurrency(order.total.toString())}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(pagina) => ordersHref({ status: activeStatus, busca, pagina })}
      />
    </div>
  );
}
