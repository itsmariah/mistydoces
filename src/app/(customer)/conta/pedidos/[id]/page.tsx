import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserOrderById } from "@/services/order-service";
import { getStoreContact, getStoreSettings } from "@/services/store-settings-service";
import { AppError } from "@/lib/errors";
import { canCustomerCancel, isFinalStatus } from "@/lib/order-status";
import { whatsappUrl } from "@/lib/whatsapp";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { OrderThanks } from "@/components/orders/order-thanks";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ScheduledFor } from "@/components/orders/scheduled-for";
import { OrderStatusWatcher } from "@/components/orders/order-status-watcher";
import { ReorderButton } from "@/components/orders/reorder-button";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { Button } from "@/components/ui/button";
import { PickupDetails } from "@/components/shared/pickup-details";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payment-labels";
import { formatCurrency } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { id } = await params;
  // `?novo=1` vem do checkout — só a primeira visita ao pedido mostra o agradecimento.
  const { novo } = await searchParams;
  const session = await auth();

  const order = await getUserOrderById(session!.user.id, id).catch((error) => {
    if (error instanceof AppError) notFound();
    throw error;
  });

  const isFinal = isFinalStatus(order.status);
  // Onde e quando retirar só interessa enquanto o pedido ainda vai ser retirado.
  const awaitingPickup = order.deliveryType === "PICKUP" && !isFinal;
  const [contact, settings] = await Promise.all([getStoreContact(), getStoreSettings()]);
  const pickup = awaitingPickup ? contact.pickup : null;
  // A mensagem já leva o número: a loja não precisa perguntar de qual pedido se trata.
  const orderWhatsappHref = settings?.whatsapp
    ? whatsappUrl(settings.whatsapp, `Olá! Quero falar sobre o meu pedido #${order.orderNumber}.`)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/conta/pedidos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Meus pedidos
        </Link>
      </div>

      {novo === "1" && (
        <OrderThanks
          title="Pedido recebido!"
          description="Obrigada por fazer parte dessa doçura! Você recebe um e-mail a cada atualização do seu pedido."
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">
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

      {order.status !== "CANCELLED" && (
        <ScheduledFor scheduledFor={order.scheduledFor} deliveryType={order.deliveryType} />
      )}

      <section className="space-y-3 rounded-lg border border-border p-4 sm:p-6">
        <OrderTimeline status={order.status} deliveryType={order.deliveryType} />
        {!isFinal && (
          <p className="text-xs text-muted-foreground">
            Esta página se atualiza sozinha quando o status do pedido mudar.
          </p>
        )}
      </section>
      <OrderStatusWatcher
        orderId={order.id}
        status={order.status}
        paymentStatus={order.payment?.status}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Itens</h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.variant.product.imageUrl ? (
                  <Image
                    src={item.variant.product.imageUrl}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <ProductPlaceholderImage className="object-contain p-1" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/cardapio/${item.variant.product.slug}`}
                  className="block truncate font-medium hover:underline"
                >
                  {item.quantity}x {item.productNameSnapshot}
                </Link>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.variantLabelSnapshot}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatCurrency(item.subtotal.toString())}
              </span>
            </li>
          ))}
        </ul>
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
        {pickup && <PickupDetails pickup={pickup} />}
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

      {(isFinal || orderWhatsappHref) && (
        <div className="flex flex-wrap gap-2">
          {isFinal && (
            <ReorderButton
              lines={order.items.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                productName: item.productNameSnapshot,
              }))}
            />
          )}
          {orderWhatsappHref && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={orderWhatsappHref} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle />
              Falar sobre este pedido
            </Button>
          )}
        </div>
      )}

      {canCustomerCancel(order.status) && <CancelOrderButton orderId={order.id} />}
    </div>
  );
}
