import { describe, expect, it } from "vitest";
import { cardapioHref, parseCatalogSort, sortProducts } from "@/lib/catalog-sort";

const products = [
  { id: "cookie", name: "Cookie", createdAt: new Date("2026-09-01"), variants: [{ price: "8.00" }] },
  {
    id: "bolo",
    name: "Bolo",
    createdAt: new Date("2026-09-20"),
    variants: [{ price: "90.00" }, { price: "45.00" }],
  },
  { id: "brigadeiro", name: "Brigadeiro", createdAt: new Date("2026-09-10"), variants: [{ price: "8.00" }] },
];

const names = (list: typeof products) => list.map((product) => product.name);

describe("parseCatalogSort", () => {
  it("aceita os valores conhecidos", () => {
    expect(parseCatalogSort("menor-preco")).toBe("menor-preco");
  });

  it("cai no padrão para valor ausente ou desconhecido", () => {
    expect(parseCatalogSort(undefined)).toBe("nome");
    expect(parseCatalogSort("preco-crescente")).toBe("nome");
    expect(parseCatalogSort("toString")).toBe("nome");
  });
});

describe("sortProducts", () => {
  it("ordena por nome em ordem alfabética", () => {
    expect(names(sortProducts(products, "nome", new Map()))).toEqual([
      "Bolo",
      "Brigadeiro",
      "Cookie",
    ]);
  });

  it("ordena pelo preço da variante mais barata, desempatando pelo nome", () => {
    expect(names(sortProducts(products, "menor-preco", new Map()))).toEqual([
      "Brigadeiro",
      "Cookie",
      "Bolo",
    ]);
  });

  it("ordena pelos mais vendidos, com produtos sem venda no fim", () => {
    const units = new Map([
      ["cookie", 12],
      ["bolo", 3],
    ]);

    expect(names(sortProducts(products, "mais-vendidos", units))).toEqual([
      "Cookie",
      "Bolo",
      "Brigadeiro",
    ]);
  });

  it("ordena pelos mais recentes", () => {
    expect(names(sortProducts(products, "novidades", new Map()))).toEqual([
      "Bolo",
      "Brigadeiro",
      "Cookie",
    ]);
  });

  it("não altera o array original", () => {
    const copy = [...products];
    sortProducts(products, "menor-preco", new Map());
    expect(products).toEqual(copy);
  });
});

describe("cardapioHref", () => {
  it("omite parâmetros padrão", () => {
    expect(cardapioHref(undefined, "nome")).toBe("/cardapio");
  });

  it("mantém categoria e ordenação juntas", () => {
    expect(cardapioHref("bolos", "menor-preco")).toBe("/cardapio?categoria=bolos&ordem=menor-preco");
  });
});
