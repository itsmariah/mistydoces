import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserOrderById } from "@/services/order-service";
import { AppError } from "@/lib/errors";
import { PixPayment } from "@/components/checkout/pix-payment";
import { CardPayment } from "@/components/checkout/card-payment";

export default async function OrderPaymentPage({
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

  const isOnlinePayment =
    order.payment?.method === "PIX_ONLINE" || order.payment?.method === "CARD_ONLINE";
  if (!order.payment || !isOnlinePayment) {
    redirect(`/conta/pedidos/${order.id}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div>
        <Link
          href={`/conta/pedidos/${order.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pedido #{order.orderNumber}
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-semibold">
        Pagamento via {order.payment.method === "PIX_ONLINE" ? "Pix" : "cartão"}
      </h1>

      {order.payment.method === "PIX_ONLINE" ? (
        <PixPayment
          orderId={order.id}
          total={Number(order.total)}
          initial={
            order.payment.pixQrCode
              ? {
                  qrCode: order.payment.pixQrCode,
                  qrCodeBase64: order.payment.pixQrCodeBase64,
                  expiresAt: order.payment.pixExpiresAt,
                  status: order.payment.status,
                }
              : null
          }
        />
      ) : (
        <CardPayment
          orderId={order.id}
          total={Number(order.total)}
          payerEmail={session!.user.email ?? ""}
          initialStatus={order.payment.status}
        />
      )}
    </div>
  );
}
