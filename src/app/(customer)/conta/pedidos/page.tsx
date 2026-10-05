import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrders } from "@/services/order-service";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  OrderItemThumbnails,
  summarizeOrderItems,
} from "@/components/orders/order-item-thumbnails";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { formatScheduledShort } from "@/lib/scheduling";

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getUserOrders(session!.user.id);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <EmptyState
          image={{ src: "/branding/14_pote_de_biscoitos.png", width: 140, height: 146 }}
          title="Nenhum pedido ainda"
          description="Quando você fizer seu primeiro pedido, ele aparece aqui para você acompanhar."
          action={
            <Button nativeButton={false} render={<Link href="/cardapio" />}>
              Ver cardápio
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <OrderItemThumbnails
                images={order.items.map((item) => item.variant.product.imageUrl)}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium">Pedido #{order.orderNumber}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {summarizeOrderItems(order.items.map((item) => item.productNameSnapshot))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.scheduledFor && order.status !== "CANCELLED"
                    ? `${order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada"}: ${formatScheduledShort(order.scheduledFor)}`
                    : new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(order.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm font-semibold text-link">
                  {formatCurrency(order.total.toString())}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
