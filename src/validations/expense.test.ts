import { describe, expect, it } from "vitest";
import { expenseSchema } from "@/validations/expense";

const valid = { title: " chocolates ", category: "MATERIAL", amount: 75, date: "2026-10-06" };

describe("expenseSchema", () => {
  it("aceita o exemplo da loja e limpa o título", () => {
    expect(expenseSchema.parse(valid)).toEqual({ ...valid, title: "chocolates" });
  });

  it("arredonda o valor para centavos", () => {
    expect(expenseSchema.parse({ ...valid, amount: 10.005 }).amount).toBe(10.01);
  });

  it("recusa valor zero, categoria fora da lista e data inexistente", () => {
    expect(expenseSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, category: "material" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, date: "2026-02-30" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });
});
