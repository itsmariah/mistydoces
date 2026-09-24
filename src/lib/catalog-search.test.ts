import { describe, expect, it } from "vitest";
import { filterProductsBySearch } from "@/lib/catalog-search";

const products = [
  { name: "Brigadeiro de Paçoca", description: "Com amendoim.", category: { name: "Brigadeiros" } },
  { name: "Cookie de Pistache", description: null, category: { name: "Cookies" } },
  { name: "Brownie Tradicional", description: "Chocolate meio amargo.", category: { name: "Brownies" } },
];

const names = (list: typeof products) => list.map((product) => product.name);

describe("filterProductsBySearch", () => {
  it("devolve tudo quando a busca está vazia", () => {
    expect(filterProductsBySearch(products, undefined)).toHaveLength(3);
    expect(filterProductsBySearch(products, "   ")).toHaveLength(3);
  });

  it("ignora acentos e maiúsculas", () => {
    expect(names(filterProductsBySearch(products, "PACOCA"))).toEqual(["Brigadeiro de Paçoca"]);
  });

  it("procura também na descrição e na categoria", () => {
    expect(names(filterProductsBySearch(products, "amargo"))).toEqual(["Brownie Tradicional"]);
    expect(names(filterProductsBySearch(products, "cookies"))).toEqual(["Cookie de Pistache"]);
  });

  it("exige que todas as palavras apareçam", () => {
    expect(names(filterProductsBySearch(products, "brigadeiro amendoim"))).toEqual([
      "Brigadeiro de Paçoca",
    ]);
    expect(filterProductsBySearch(products, "brigadeiro pistache")).toEqual([]);
  });
});
