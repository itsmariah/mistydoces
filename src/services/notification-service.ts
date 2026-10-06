import type { DeliveryType, OrderStatus } from "@/generated/prisma/client";
import { renderEmail, type EmailContent, type EmailLine } from "@/lib/email-template";
import { formatScheduledFor } from "@/lib/scheduling";
import { EMAIL_FROM, getResendClient } from "@/lib/resend";
import { formatCurrency } from "@/lib/utils";
import { getStoreContact } from "@/services/store-settings-service";

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
  deliveryType: DeliveryType;
  /** Janela agendada (pedidos antigos não têm). */
  scheduledFor?: Date | null;
  items?: {
    quantity: number;
    productNameSnapshot: string;
    variantLabelSnapshot: string;
    subtotal: unknown;
    note?: string | null;
  }[];
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

/** "Entrega agendada para sábado, 10 de outubro · 15h–16h." */
function scheduleSentence(order: NotifiableOrder): string | null {
  if (!order.scheduledFor) return null;
  const kind = order.deliveryType === "DELIVERY" ? "Entrega" : "Retirada";
  return `${kind} agendada para ${formatScheduledFor(order.scheduledFor)}.`;
}

/** Status em que a data ainda vai acontecer — vale lembrar no e-mail. */
const UPCOMING_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** Na retirada, "Entregue" vira "Retirado" — é o que aconteceu de fato. */
export function statusLabelFor(status: OrderStatus, deliveryType: DeliveryType): string {
  if (status === "DELIVERED" && deliveryType === "PICKUP") return "Retirado";
  return STATUS_LABELS[status];
}

/** O texto principal de cada status, já pensando em entrega x retirada. */
function statusMessage(status: OrderStatus, deliveryType: DeliveryType): string {
  const pickup = deliveryType === "PICKUP";
  switch (status) {
    case "PENDING":
      return "Seu pedido está aguardando a confirmação da loja.";
    case "CONFIRMED":
      return "A loja confirmou seu pedido, e ele já está na fila da cozinha.";
    case "PREPARING":
      return "Seus doces estão sendo preparados agora, com todo o carinho.";
    case "READY":
      return pickup
        ? "Seu pedido está pronto! Já pode vir retirar."
        : "Seu pedido está pronto e logo sai para entrega.";
    case "OUT_FOR_DELIVERY":
      return "Seu pedido saiu para entrega e chega em breve.";
    case "DELIVERED":
      return pickup
        ? "Pedido retirado. Bom apetite e obrigada pela preferência!"
        : "Pedido entregue. Bom apetite e obrigada pela preferência!";
    case "CANCELLED":
      return "Seu pedido foi cancelado. Se não foi você quem pediu o cancelamento, fale com a gente.";
  }
}

/**
 * Notificações por e-mail nunca podem derrubar o fluxo principal (criar
 * pedido, mudar status): qualquer falha aqui só é logada, nunca propagada.
 */
async function sendSafely(to: string, subject: string, content: Omit<EmailContent, "whatsappHref">) {
  try {
    const { whatsappHref } = await getStoreContact();
    const { html, text } = renderEmail({ ...content, whatsappHref });
    await getResendClient().emails.send({ from: EMAIL_FROM, to, subject, html, text });
  } catch (error) {
    console.error("Falha ao enviar e-mail de notificação:", error);
  }
}

export function sendOrderConfirmationEmail(order: NotifiableOrder, user: NotifiableUser) {
  const lines: EmailLine[] = [
    ...(order.items ?? []).map((item) => ({
      label: `${item.quantity}x ${item.productNameSnapshot} (${item.variantLabelSnapshot})${item.note ? ` — "${item.note}"` : ""}`,
      value: formatCurrency(String(item.subtotal)),
    })),
    { label: "Total", value: totalLabel(order.total), strong: true },
  ];

  const schedule = scheduleSentence(order);

  return sendSafely(user.email, `Pedido #${order.orderNumber} recebido — MistyDoces`, {
    preheader: `Recebemos seu pedido #${order.orderNumber}. Acompanhe cada etapa pelo site.`,
    title: "Recebemos seu pedido!",
    paragraphs: [
      `Olá, ${firstName(user.name)}! Seu pedido #${order.orderNumber} chegou na nossa cozinha.`,
      ...(schedule ? [schedule] : []),
      "Avisamos por aqui a cada etapa, e você também pode acompanhar pelo site.",
    ],
    lines,
    cta: { label: "Acompanhar pedido", href: orderUrl(order.id) },
  });
}

export function sendOrderStatusUpdateEmail(
  order: NotifiableOrder,
  user: NotifiableUser,
  status: OrderStatus,
) {
  const label = statusLabelFor(status, order.deliveryType);
  const schedule = UPCOMING_STATUSES.includes(status) ? scheduleSentence(order) : null;
  // Depois de entregue, o próximo passo útil é avaliar — a conta lista o que falta avaliar.
  const cta =
    status === "DELIVERED"
      ? { label: "Avaliar meus doces", href: `${process.env.NEXTAUTH_URL}/conta` }
      : { label: "Ver pedido", href: orderUrl(order.id) };

  return sendSafely(user.email, `Pedido #${order.orderNumber}: ${label} — MistyDoces`, {
    preheader: statusMessage(status, order.deliveryType),
    title: `Pedido #${order.orderNumber}: ${label}`,
    paragraphs: [
      `Olá, ${firstName(user.name)}!`,
      statusMessage(status, order.deliveryType),
      ...(schedule ? [schedule] : []),
      ...(status === "DELIVERED" ? ["Conta pra gente o que achou? Sua avaliação ajuda muito."] : []),
    ],
    cta,
  });
}

type BreakEvenSummary = {
  month: string;
  /** "outubro" — o nome do mês já formatado. */
  monthName: string;
  revenue: number;
  expenses: number;
  result: number;
};

/** Aviso para quem é Proprietário: o faturamento do mês alcançou o total de despesas. */
export async function sendBreakEvenEmail(owners: NotifiableUser[], summary: BreakEvenSummary) {
  const { monthName } = summary;
  const href = `${process.env.NEXTAUTH_URL}/admin/financeiro?mes=${summary.month}`;

  await Promise.all(
    owners.map((owner) =>
      sendSafely(owner.email, `O faturamento de ${monthName} cobriu as despesas — MistyDoces`, {
        preheader: `As despesas de ${monthName} estão pagas. Daqui pra frente, é lucro!`,
        title: "Despesas do mês cobertas! 🎉",
        paragraphs: [
          `Olá, ${firstName(owner.name)}!`,
          `O faturamento de ${monthName} alcançou o total de despesas cadastradas. Daqui pra frente, o que entrar é lucro.`,
        ],
        lines: [
          { label: "Faturamento", value: formatCurrency(summary.revenue) },
          { label: "Despesas", value: formatCurrency(summary.expenses) },
          { label: "Sobra até agora", value: formatCurrency(summary.result), strong: true },
        ],
        cta: { label: "Ver financeiro", href },
      }),
    ),
  );
}
