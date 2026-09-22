import { describe, expect, it } from "vitest";
import { formatCurrency, getStartingPrice, slugify } from "@/lib/utils";

describe("slugify", () => {
  it("remove acentos e converte para minúsculas", () => {
    expect(slugify("Brigadeiro de Paçoca")).toBe("brigadeiro-de-pacoca");
  });

  it("colapsa espaços e caracteres inválidos em um único hífen", () => {
    expect(slugify("  Caixa  Degustação!!  ")).toBe("caixa-degustacao");
  });
});

describe("formatCurrency", () => {
  it("formata número em BRL", () => {
    expect(formatCurrency(12.5)).toBe("R$ 12,50");
  });

  it("aceita string numérica (ex.: Decimal do Prisma serializado)", () => {
    expect(formatCurrency("4.10")).toBe("R$ 4,10");
  });
});

describe("getStartingPrice", () => {
  it("retorna o menor preço entre as variantes", () => {
    const variants = [{ price: "15.00" }, { price: "4.00" }, { price: "21.00" }];
    expect(getStartingPrice(variants)).toBe(4);
  });
});
