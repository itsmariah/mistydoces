// Rótulos de pagamento compartilhados entre a área do cliente e o painel.
export const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro na entrega/retirada",
  PIX_MANUAL: "Pix",
  CARD_ON_DELIVERY: "Cartão na entrega/retirada",
  PIX_ONLINE: "Pix online",
  CARD_ONLINE: "Cartão online",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Em análise",
  PAID: "Pago",
  FAILED: "Não aprovado",
  EXPIRED: "Expirado",
};
