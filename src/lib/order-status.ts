import type { DeliveryType, OrderStatus } from "@/generated/prisma/client";

/**
 * Fluxo principal: PENDING -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED.
 * Na retirada (PICKUP), READY vai direto para DELIVERED — não há entrega para "sair".
 * CANCELLED é alcançável a partir de qualquer status anterior a DELIVERED (RN08).
 */
const ORDER_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

// OUT_FOR_DELIVERY -> DELIVERED continua valendo na retirada: pedidos antigos,
// criados antes desta regra, podem estar parados nesse status e precisam terminar.
const PICKUP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  READY: ["DELIVERED", "CANCELLED"],
};

/** Próximos status válidos a partir do atual — usado pelos controles do admin. */
export function getNextStatuses(from: OrderStatus, deliveryType: DeliveryType): OrderStatus[] {
  const pickupOverride = deliveryType === "PICKUP" ? PICKUP_TRANSITIONS[from] : undefined;
  return pickupOverride ?? VALID_TRANSITIONS[from] ?? [];
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  deliveryType: DeliveryType,
): boolean {
  return getNextStatuses(from, deliveryType).includes(to);
}

export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "PENDING";
}

export function isOrderFlowStatus(status: OrderStatus): boolean {
  return ORDER_FLOW.includes(status);
}

export { ORDER_FLOW };

export type TimelineStepState = "done" | "current" | "upcoming";

/**
 * Etapas exibidas na linha do tempo do pedido do cliente, cada uma marcada como
 * concluída, atual ou futura. Na retirada, "Saiu para entrega" não existe e é
 * omitida — um pedido de retirada antigo, parado nesse status de antes da regra
 * de PICKUP_TRANSITIONS, aparece como "Pronto".
 * CANCELLED não tem linha do tempo: não há histórico de em qual etapa parou.
 */
export function getTimelineSteps(
  status: OrderStatus,
  deliveryType: DeliveryType,
): Array<{ status: OrderStatus; state: TimelineStepState }> {
  const steps =
    deliveryType === "PICKUP"
      ? ORDER_FLOW.filter((step) => step !== "OUT_FOR_DELIVERY")
      : ORDER_FLOW;
  const effectiveStatus =
    deliveryType === "PICKUP" && status === "OUT_FOR_DELIVERY" ? "READY" : status;
  const currentIndex = steps.indexOf(effectiveStatus);

  return steps.map((step, index) => ({
    status: step,
    state:
      // O último passo concluído é "done", não "current" — o pedido acabou.
      index < currentIndex || (index === currentIndex && step === "DELIVERED")
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}
