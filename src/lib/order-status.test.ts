import { describe, expect, it } from "vitest";
import { canCustomerCancel, canTransition, getNextStatuses } from "@/lib/order-status";

describe("canTransition", () => {
  it("permite avançar no fluxo principal", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("permite cancelar a partir de qualquer status anterior a DELIVERED", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("READY", "CANCELLED")).toBe(true);
  });

  it("rejeita pular etapas do fluxo", () => {
    expect(canTransition("PENDING", "PREPARING")).toBe(false);
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
  });

  it("rejeita qualquer transição a partir de um status final", () => {
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
  });
});

describe("getNextStatuses", () => {
  it("retorna os próximos status válidos", () => {
    expect(getNextStatuses("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
  });

  it("retorna array vazio para status finais", () => {
    expect(getNextStatuses("DELIVERED")).toEqual([]);
    expect(getNextStatuses("CANCELLED")).toEqual([]);
  });
});

describe("canCustomerCancel", () => {
  it("só permite o cliente cancelar enquanto PENDING", () => {
    expect(canCustomerCancel("PENDING")).toBe(true);
    expect(canCustomerCancel("CONFIRMED")).toBe(false);
    expect(canCustomerCancel("DELIVERED")).toBe(false);
  });
});
