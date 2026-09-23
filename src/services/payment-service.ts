import {
  Payment as MercadoPagoPayment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import type { PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { mercadoPagoClient } from "@/lib/mercado-pago";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import * as orderService from "@/services/order-service";

const PROVIDER = "MERCADO_PAGO";

/** Mapeia o status bruto retornado pela API do Mercado Pago para o nosso enum interno. */
function mapExternalStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return "PAID";
    case "pending":
    case "in_process":
    case "authorized":
      return "PROCESSING";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "FAILED";
    default:
      return "PENDING";
  }
}

/**
 * Cria (ou reaproveita, se o cliente atualizar a página) uma cobrança Pix no
 * Mercado Pago para um pedido já existente. `document` (CPF) é exigido pela
 * API do MP para pagamentos Pix e não é persistido — só trafega até a chamada.
 */
export async function createPixPayment(
  userId: string,
  orderId: string,
  document: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, user: { select: { name: true, email: true } } },
  });
  if (!order || !order.payment) throw new NotFoundError("Pedido não encontrado.");
  if (order.userId !== userId) throw new ForbiddenError();
  if (order.payment.method !== "PIX_ONLINE") {
    throw new AppError("INVALID_PAYMENT_METHOD", "Este pedido não usa Pix online.", 409);
  }

  // Reaproveita a cobrança já criada enquanto ela ainda não expirou, para não
  // gerar um novo QR code (e uma nova cobrança no MP) a cada refresh da página.
  const existing = order.payment;
  if (
    existing.externalId &&
    existing.pixQrCode &&
    existing.status !== "FAILED" &&
    existing.status !== "EXPIRED" &&
    (!existing.pixExpiresAt || existing.pixExpiresAt.getTime() > Date.now())
  ) {
    return {
      qrCode: existing.pixQrCode,
      qrCodeBase64: existing.pixQrCodeBase64,
      expiresAt: existing.pixExpiresAt,
      status: existing.status,
    };
  }

  const [firstName, ...rest] = order.user.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const mpPayment = new MercadoPagoPayment(mercadoPagoClient);
  const response = await mpPayment.create({
    body: {
      transaction_amount: Number(order.total),
      description: `Pedido #${order.orderNumber} — MistyDoces`,
      payment_method_id: "pix",
      external_reference: order.id,
      notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercado-pago`,
      payer: {
        email: order.user.email,
        first_name: firstName,
        last_name: lastName,
        identification: { type: "CPF", number: document.replace(/\D/g, "") },
      },
    },
    requestOptions: { idempotencyKey: order.payment.id },
  });

  const transactionData = response.point_of_interaction?.transaction_data;
  const status = mapExternalStatus(response.status);

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      status,
      provider: PROVIDER,
      externalId: String(response.id),
      externalStatus: response.status ?? null,
      pixQrCode: transactionData?.qr_code ?? null,
      pixQrCodeBase64: transactionData?.qr_code_base64 ?? null,
      pixExpiresAt: response.date_of_expiration ? new Date(response.date_of_expiration) : null,
    },
  });

  return {
    qrCode: transactionData?.qr_code ?? null,
    qrCodeBase64: transactionData?.qr_code_base64 ?? null,
    expiresAt: response.date_of_expiration ? new Date(response.date_of_expiration) : null,
    status,
  };
}

/**
 * Processa uma notificação de webhook do Mercado Pago. Nunca confia no corpo
 * da requisição: valida a assinatura e, com o `id` recebido, busca o pagamento
 * de verdade na API do MP antes de aplicar qualquer efeito no pedido.
 */
export async function processWebhookNotification(input: {
  type: string | null;
  dataId: string | null;
  xSignature: string | null;
  xRequestId: string | null;
}) {
  if (input.type !== "payment" || !input.dataId) return;

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "";
  try {
    WebhookSignatureValidator.validate({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      throw new AppError("INVALID_WEBHOOK_SIGNATURE", "Assinatura de webhook inválida.", 401);
    }
    throw error;
  }

  const mpPayment = new MercadoPagoPayment(mercadoPagoClient);
  const payment = await mpPayment.get({ id: input.dataId });

  const orderId = payment.external_reference;
  if (!orderId) return;

  await orderService.applyGatewayPaymentUpdate(orderId, {
    status: mapExternalStatus(payment.status),
    externalId: String(payment.id),
    externalStatus: payment.status ?? "",
  });
}
