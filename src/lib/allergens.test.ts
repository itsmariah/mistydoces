import { describe, expect, it } from "vitest";
import { filterFreeFrom, parseFreeFrom, sortAllergens } from "@/lib/allergens";

const product = (id: string, ingredients: string | null, allergens: string[] = []) => ({
  id,
  ingredients,
  allergens,
});

describe("parseFreeFrom", () => {
  it("lê os filtros conhecidos da URL e ignora o resto", () => {
    expect(parseFreeFrom(undefined)).toEqual([]);
    expect(parseFreeFrom("ovos,gluten,xyz")).toEqual(["gluten", "ovos"]);
  });
});

describe("filterFreeFrom", () => {
  const products = [
    product("brigadeiro", "Leite condensado, chocolate", ["LACTOSE"]),
    product("bolo", "Farinha de trigo, ovos, leite", ["GLUTEN", "EGGS", "LACTOSE"]),
    product("sorbet", "Fruta, açúcar", []),
    product("sem-info", null, []),
    product("so-espacos", "   ", []),
  ];

  it("sem filtro, mostra tudo", () => {
    expect(filterFreeFrom(products, [])).toHaveLength(products.length);
  });

  it("deixa de fora quem contém o alérgeno e quem não tem ingredientes informados", () => {
    expect(filterFreeFrom(products, ["gluten"]).map((item) => item.id)).toEqual([
      "brigadeiro",
      "sorbet",
    ]);
  });

  it("vários filtros somam as restrições", () => {
    expect(filterFreeFrom(products, ["gluten", "lactose"]).map((item) => item.id)).toEqual(["sorbet"]);
  });
});

describe("sortAllergens", () => {
  it("segue a ordem da lista oficial", () => {
    expect(sortAllergens(["COCONUT", "GLUTEN", "LACTOSE"])).toEqual(["GLUTEN", "LACTOSE", "COCONUT"]);
  });
});
