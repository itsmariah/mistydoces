import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { adminGetOrderById } from "@/services/order-service";
import { AppError } from "@/lib/errors";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payment-labels";
import { formatCurrency } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePagePermission("orders:view");
  const { id } = await params;

  const order = await adminGetOrderById(id).catch((error) => {
    if (error instanceof AppError) notFound();
    throw error;
  });

  const firstName = order.user.name.split(" ")[0];
  const whatsappHref = whatsappUrl(
    order.user.phone,
    `Olá, ${firstName}! Aqui é da Misty Doces, sobre o seu pedido #${order.orderNumber}.`,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pedidos
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderStatusActions
        orderId={order.id}
        orderNumber={order.orderNumber}
        status={order.status}
        deliveryType={order.deliveryType}
        paymentStatus={order.payment?.status}
        paymentProvider={order.payment?.provider}
        canCancel={can(user.role, "orders:cancel")}
        canMarkPaid={can(user.role, "orders:mark_paid")}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Cliente</h2>
        <p className="text-sm text-muted-foreground">
          {order.user.name} — {order.user.email} — {order.user.phone}
        </p>
        {whatsappHref && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle /> Conversar no WhatsApp
          </Button>
        )}
      </section>

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
            {order.deliveryReference ? ` — Referência: ${order.deliveryReference}` : ""}
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
        {order.payment?.provider && (
          <p className="text-xs text-muted-foreground">
            Processado via {order.payment.provider} — ID {order.payment.externalId}
          </p>
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
    </div>
  );
}
