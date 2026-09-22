import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrders } from "@/services/order-service";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCurrency } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getUserOrders(session!.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não fez nenhum pedido.{" "}
          <Link href="/cardapio" className="text-primary underline underline-offset-4">
            Ver cardápio
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">Pedido #{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm font-semibold text-primary">
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
