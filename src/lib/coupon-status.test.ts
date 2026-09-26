import { describe, expect, it } from "vitest";
import { getCouponStatus } from "@/lib/coupon-status";

const now = new Date("2026-09-26T12:00:00Z");
const base = { isActive: true, expiresAt: null, maxUses: null, usedCount: 0 };

describe("getCouponStatus", () => {
  it("cupom sem restrições está ativo", () => {
    expect(getCouponStatus(base, now)).toBe("ACTIVE");
  });

  it("desativado manualmente", () => {
    expect(getCouponStatus({ ...base, isActive: false }, now)).toBe("INACTIVE");
  });

  it("vencido quando a validade já passou", () => {
    expect(getCouponStatus({ ...base, expiresAt: new Date("2026-09-25T00:00:00Z") }, now)).toBe(
      "EXPIRED",
    );
    expect(getCouponStatus({ ...base, expiresAt: new Date("2026-09-27T00:00:00Z") }, now)).toBe(
      "ACTIVE",
    );
  });

  it("usos esgotados quando atinge o limite", () => {
    expect(getCouponStatus({ ...base, maxUses: 10, usedCount: 10 }, now)).toBe("EXHAUSTED");
    expect(getCouponStatus({ ...base, maxUses: 10, usedCount: 9 }, now)).toBe("ACTIVE");
  });

  it("segue a prioridade do checkout: inativo > vencido > esgotado", () => {
    const everything = {
      isActive: false,
      expiresAt: new Date("2026-01-01T00:00:00Z"),
      maxUses: 1,
      usedCount: 1,
    };
    expect(getCouponStatus(everything, now)).toBe("INACTIVE");
    expect(getCouponStatus({ ...everything, isActive: true }, now)).toBe("EXPIRED");
  });
});
