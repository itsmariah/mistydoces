import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrderById } from "@/services/order-service";
import { AppError } from "@/lib/errors";
import { canCustomerCancel } from "@/lib/order-status";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro na entrega/retirada",
  PIX_MANUAL: "Pix",
  CARD_ON_DELIVERY: "Cartão na entrega/retirada",
  PIX_ONLINE: "Pix online",
  CARD_ONLINE: "Cartão online",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Em análise",
  PAID: "Pago",
  FAILED: "Não aprovado",
  EXPIRED: "Expirado",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const order = await getUserOrderById(session!.user.id, id).catch((error) => {
    if (error instanceof AppError) notFound();
    throw error;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div>
        <Link
          href="/conta/pedidos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meus pedidos
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Pedido #{order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Itens</h2>
        <div className="space-y-2 rounded-lg border border-border p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.productNameSnapshot} ({item.variantLabelSnapshot})
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(item.subtotal.toString())}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">
          {order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada no local"}
        </h2>
        {order.deliveryType === "DELIVERY" && (
          <p className="text-sm text-muted-foreground">
            {order.deliveryLabel} — {order.deliveryStreet}, {order.deliveryNumber}
            {order.deliveryComplement ? `, ${order.deliveryComplement}` : ""} —{" "}
            {order.deliveryNeighborhood}, {order.deliveryCity}/{order.deliveryState}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Pagamento</h2>
        <p className="text-sm text-muted-foreground">
          {PAYMENT_LABELS[order.payment?.method ?? ""] ?? order.payment?.method}
          {" — "}
          {PAYMENT_STATUS_LABELS[order.payment?.status ?? ""] ?? order.payment?.status}
        </p>
        {(order.payment?.method === "PIX_ONLINE" || order.payment?.method === "CARD_ONLINE") &&
          order.payment.status !== "PAID" && (
            <Link
              href={`/conta/pedidos/${order.id}/pagamento`}
              className="text-sm font-medium text-link hover:underline"
            >
              Ir para o pagamento →
            </Link>
          )}
      </section>

      {order.notes && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Observações</h2>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </section>
      )}

      <section className="space-y-2 rounded-lg border border-border p-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal.toString())}</span>
        </div>
        {Number(order.discountAmount) > 0 && (
          <div className="flex justify-between text-sm text-link">
            <span>
              Desconto{order.couponCodeSnapshot ? ` (${order.couponCodeSnapshot})` : ""}
            </span>
            <span>-{formatCurrency(order.discountAmount.toString())}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Taxa de entrega</span>
          <span>{formatCurrency(order.deliveryFee.toString())}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="text-link">{formatCurrency(order.total.toString())}</span>
        </div>
      </section>

      {canCustomerCancel(order.status) && <CancelOrderButton orderId={order.id} />}
    </div>
  );
}
