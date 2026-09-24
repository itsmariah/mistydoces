import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";
import { adminListOrders } from "@/services/order-service";
import { OrderStatusBadge, STATUS_LABELS } from "@/components/orders/order-status-badge";
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUS_FILTERS.find((s) => s === status);
  const orders = await adminListOrders(activeStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Pedidos</h1>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/pedidos"
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            !activeStatus ? "border-link bg-primary/10 text-link" : "border-border",
          )}
        >
          Todos
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/pedidos?status=${s}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              activeStatus === s ? "border-link bg-primary/10 text-link" : "border-border",
            )}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/pedidos/${order.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Pedido #{order.orderNumber} — {order.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm font-semibold text-link">
                  {formatCurrency(order.total.toString())}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
