import { describe, expect, it } from "vitest";
import {
  canCustomerCancel,
  canTransition,
  getNextStatuses,
  getTimelineSteps,
} from "@/lib/order-status";

describe("canTransition", () => {
  it("permite avançar no fluxo principal", () => {
    expect(canTransition("PENDING", "CONFIRMED", "DELIVERY")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING", "DELIVERY")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY")).toBe(true);
  });

  it("permite cancelar a partir de qualquer status anterior a DELIVERED", () => {
    expect(canTransition("PENDING", "CANCELLED", "DELIVERY")).toBe(true);
    expect(canTransition("READY", "CANCELLED", "DELIVERY")).toBe(true);
  });

  it("rejeita pular etapas do fluxo", () => {
    expect(canTransition("PENDING", "PREPARING", "DELIVERY")).toBe(false);
    expect(canTransition("PENDING", "DELIVERED", "DELIVERY")).toBe(false);
  });

  it("rejeita qualquer transição a partir de um status final", () => {
    expect(canTransition("DELIVERED", "CANCELLED", "DELIVERY")).toBe(false);
    expect(canTransition("CANCELLED", "PENDING", "DELIVERY")).toBe(false);
  });
});

describe("getNextStatuses", () => {
  it("retorna os próximos status válidos", () => {
    expect(getNextStatuses("PENDING", "DELIVERY")).toEqual(["CONFIRMED", "CANCELLED"]);
  });

  it("retorna array vazio para status finais", () => {
    expect(getNextStatuses("DELIVERED", "DELIVERY")).toEqual([]);
    expect(getNextStatuses("CANCELLED", "DELIVERY")).toEqual([]);
  });
});

describe("fluxo de retirada (PICKUP)", () => {
  it("vai de READY direto para DELIVERED, sem passar por OUT_FOR_DELIVERY", () => {
    expect(getNextStatuses("READY", "PICKUP")).toEqual(["DELIVERED", "CANCELLED"]);
    expect(canTransition("READY", "OUT_FOR_DELIVERY", "PICKUP")).toBe(false);
  });

  it("ainda deixa terminar pedidos antigos parados em OUT_FOR_DELIVERY", () => {
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED", "PICKUP")).toBe(true);
  });

  it("não deixa a entrega pular OUT_FOR_DELIVERY", () => {
    expect(canTransition("READY", "DELIVERED", "DELIVERY")).toBe(false);
  });

  it("segue o fluxo normal nas etapas anteriores a READY", () => {
    expect(getNextStatuses("PREPARING", "PICKUP")).toEqual(["READY", "CANCELLED"]);
  });
});

describe("canCustomerCancel", () => {
  it("só permite o cliente cancelar enquanto PENDING", () => {
    expect(canCustomerCancel("PENDING")).toBe(true);
    expect(canCustomerCancel("CONFIRMED")).toBe(false);
    expect(canCustomerCancel("DELIVERED")).toBe(false);
  });
});

describe("getTimelineSteps", () => {
  it("marca etapas anteriores como concluídas e a atual como atual", () => {
    const steps = getTimelineSteps("PREPARING", "DELIVERY");

    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("omite 'Saiu para entrega' na retirada", () => {
    const steps = getTimelineSteps("CONFIRMED", "PICKUP");

    expect(steps.map((step) => step.status)).not.toContain("OUT_FOR_DELIVERY");
    expect(steps).toHaveLength(5);
  });

  it("mostra retirada em OUT_FOR_DELIVERY como 'Pronto'", () => {
    const steps = getTimelineSteps("OUT_FOR_DELIVERY", "PICKUP");

    expect(steps.find((step) => step.state === "current")?.status).toBe("READY");
  });

  it("marca tudo como concluído quando o pedido foi entregue", () => {
    const steps = getTimelineSteps("DELIVERED", "DELIVERY");

    expect(steps.every((step) => step.state === "done")).toBe(true);
  });
});
