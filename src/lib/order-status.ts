import type { DeliveryType, OrderStatus } from "@/generated/prisma/client";

/**
 * Fluxo principal: PENDING -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED.
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

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Próximos status válidos a partir do atual — usado pelos controles do admin. */
export function getNextStatuses(from: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
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
 * concluída, atual ou futura. Na retirada, "Saiu para entrega" não faz sentido
 * para o cliente e é omitida — um pedido de retirada nesse status aparece como
 * "Pronto" (a máquina de status ainda exige essa etapa no admin).
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
