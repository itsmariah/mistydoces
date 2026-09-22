import type { OrderStatus } from "@/generated/prisma/client";
import { EMAIL_FROM, getResendClient } from "@/lib/resend";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

type NotifiableOrder = {
  id: string;
  orderNumber: number;
  total: unknown;
};

type NotifiableUser = {
  name: string;
  email: string;
};

function orderUrl(orderId: string): string {
  return `${process.env.NEXTAUTH_URL}/conta/pedidos/${orderId}`;
}

function totalLabel(total: unknown): string {
  return formatCurrency(String(total));
}

/**
 * Notificações por e-mail nunca podem derrubar o fluxo principal (criar
 * pedido, mudar status): qualquer falha aqui só é logada, nunca propagada.
 */
async function sendSafely(payload: Parameters<
  ReturnType<typeof getResendClient>["emails"]["send"]
>[0]) {
  try {
    await getResendClient().emails.send(payload);
  } catch (error) {
    console.error("Falha ao enviar e-mail de notificação:", error);
  }
}

export function sendOrderConfirmationEmail(order: NotifiableOrder, user: NotifiableUser) {
  return sendSafely({
    from: EMAIL_FROM,
    to: user.email,
    subject: `Pedido #${order.orderNumber} recebido — MistyDoces`,
    html: `
      <p>Olá, ${user.name}!</p>
      <p>Recebemos seu pedido <strong>#${order.orderNumber}</strong>, no valor de ${totalLabel(order.total)}.</p>
      <p>Acompanhe o status por aqui: <a href="${orderUrl(order.id)}">${orderUrl(order.id)}</a></p>
    `,
  });
}

export function sendOrderStatusUpdateEmail(
  order: NotifiableOrder,
  user: NotifiableUser,
  status: OrderStatus,
) {
  return sendSafely({
    from: EMAIL_FROM,
    to: user.email,
    subject: `Pedido #${order.orderNumber}: ${STATUS_LABELS[status]} — MistyDoces`,
    html: `
      <p>Olá, ${user.name}!</p>
      <p>O status do seu pedido <strong>#${order.orderNumber}</strong> foi atualizado para:
      <strong>${STATUS_LABELS[status]}</strong>.</p>
      <p>Acompanhe os detalhes: <a href="${orderUrl(order.id)}">${orderUrl(order.id)}</a></p>
    `,
  });
}
