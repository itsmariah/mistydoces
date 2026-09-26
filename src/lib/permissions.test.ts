import { describe, expect, it } from "vitest";
import { can, isStaff, type Permission } from "@/lib/permissions";

describe("can", () => {
  it("cliente não tem nenhuma permissão de painel", () => {
    expect(can("CUSTOMER", "orders:view")).toBe(false);
    expect(can(undefined, "orders:view")).toBe(false);
  });

  it("atendente vê tudo que é operacional e só altera status de pedido", () => {
    const allowed: Permission[] = [
      "orders:view",
      "orders:update_status",
      "reviews:view",
      "customers:view",
      "products:view",
      "categories:view",
      "coupons:view",
    ];
    for (const permission of allowed) expect(can("STAFF", permission)).toBe(true);

    const denied: Permission[] = [
      "dashboard:view",
      "orders:cancel",
      "orders:mark_paid",
      "reviews:moderate",
      "products:edit",
      "categories:edit",
      "coupons:edit",
      "settings:manage",
      "team:manage",
    ];
    for (const permission of denied) expect(can("STAFF", permission)).toBe(false);
  });

  it("gerente edita e cancela, mas não exclui nem mexe em configurações/equipe", () => {
    expect(can("MANAGER", "dashboard:view")).toBe(true);
    expect(can("MANAGER", "orders:cancel")).toBe(true);
    expect(can("MANAGER", "reviews:moderate")).toBe(true);
    expect(can("MANAGER", "products:edit")).toBe(true);
    expect(can("MANAGER", "coupons:edit")).toBe(true);

    expect(can("MANAGER", "products:delete")).toBe(false);
    expect(can("MANAGER", "categories:delete")).toBe(false);
    expect(can("MANAGER", "coupons:delete")).toBe(false);
    expect(can("MANAGER", "settings:manage")).toBe(false);
    expect(can("MANAGER", "team:manage")).toBe(false);
  });

  it("proprietário pode tudo", () => {
    expect(can("OWNER", "settings:manage")).toBe(true);
    expect(can("OWNER", "team:manage")).toBe(true);
    expect(can("OWNER", "coupons:delete")).toBe(true);
  });
});

describe("isStaff", () => {
  it("só níveis da equipe entram no painel", () => {
    expect(isStaff("CUSTOMER")).toBe(false);
    expect(isStaff(undefined)).toBe(false);
    expect(isStaff("STAFF")).toBe(true);
    expect(isStaff("MANAGER")).toBe(true);
    expect(isStaff("OWNER")).toBe(true);
  });
});
