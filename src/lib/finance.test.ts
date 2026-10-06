import { describe, expect, it } from "vitest";
import {
  addMonths,
  coversExpenses,
  formatMonthLabel,
  formatMonthName,
  isMonthKey,
  monthDayRange,
  summarizeFinance,
  toMonthKey,
} from "@/lib/finance";

describe("toMonthKey", () => {
  it("usa o fuso da loja: 01/11 às 01h UTC ainda é outubro em São Paulo", () => {
    expect(toMonthKey(new Date("2026-11-01T01:00:00Z"))).toBe("2026-10");
    expect(toMonthKey(new Date("2026-11-01T03:00:00Z"))).toBe("2026-11");
  });
});

describe("isMonthKey", () => {
  it("aceita só YYYY-MM com mês válido", () => {
    expect(isMonthKey("2026-10")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey(undefined)).toBe(false);
  });
});

describe("addMonths", () => {
  it("vira o ano nos dois sentidos", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", 0)).toBe("2026-10");
  });
});

describe("monthDayRange", () => {
  it("vai do dia 1 até o dia 1 do mês seguinte (exclusivo)", () => {
    expect(monthDayRange("2026-12")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
  });
});

describe("formatMonthLabel", () => {
  it("escreve o mês por extenso", () => {
    expect(formatMonthLabel("2026-10")).toBe("outubro de 2026");
    expect(formatMonthName("2026-03")).toBe("março");
  });
});

describe("summarizeFinance", () => {
  it("soma em centavos e agrupa por categoria, da maior para a menor", () => {
    const summary = summarizeFinance(100.3, [
      { category: "MATERIAL", amount: 0.1 },
      { category: "EMBALAGEM", amount: 30 },
      { category: "MATERIAL", amount: 0.2 },
      { category: "MATERIAL", amount: 75 },
    ]);
    expect(summary.expenses).toBe(105.3);
    expect(summary.result).toBe(-5);
    expect(summary.coverage).toBeCloseTo(100.3 / 105.3);
    expect(summary.byCategory).toEqual([
      { category: "MATERIAL", total: 75.3, count: 3 },
      { category: "EMBALAGEM", total: 30, count: 1 },
    ]);
  });

  it("limita a cobertura a 100% e não calcula sem despesas", () => {
    expect(summarizeFinance(500, [{ category: "OUTROS", amount: 100 }]).coverage).toBe(1);
    expect(summarizeFinance(500, []).coverage).toBeNull();
  });
});

describe("coversExpenses", () => {
  it("só cobre quando há despesa e o faturamento alcança o total", () => {
    expect(coversExpenses({ revenue: 75, expenses: 75 })).toBe(true);
    expect(coversExpenses({ revenue: 74.99, expenses: 75 })).toBe(false);
    expect(coversExpenses({ revenue: 100, expenses: 0 })).toBe(false);
  });
});
