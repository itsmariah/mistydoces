import type { OrderStatus } from "@/generated/prisma/client";

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

export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "PENDING";
}

export function isOrderFlowStatus(status: OrderStatus): boolean {
  return ORDER_FLOW.includes(status);
}

export { ORDER_FLOW };
