import { describe, expect, it } from "vitest";
import {
  MAX_FAVORITES,
  parseFavoritesCookie,
  serializeFavoritesCookie,
  toggleFavoriteId,
} from "@/lib/favorites";

const id = (n: number) => `cmproduto${String(n).padStart(6, "0")}`;

describe("cookie de favoritos", () => {
  it("lê ids válidos, sem repetição, e ignora lixo", () => {
    expect(parseFavoritesCookie(undefined)).toEqual([]);
    expect(parseFavoritesCookie(`${id(1)}.<script>.${id(2)}.${id(1)}`)).toEqual([id(1), id(2)]);
  });

  it("vai e volta pelo mesmo formato, respeitando o limite", () => {
    const many = Array.from({ length: MAX_FAVORITES + 5 }, (_, n) => id(n));
    expect(parseFavoritesCookie(serializeFavoritesCookie(many))).toHaveLength(MAX_FAVORITES);
  });
});

describe("toggleFavoriteId", () => {
  it("adiciona na frente sem repetir e remove", () => {
    expect(toggleFavoriteId([id(1), id(2)], id(2), true)).toEqual([id(2), id(1)]);
    expect(toggleFavoriteId([id(1), id(2)], id(1), false)).toEqual([id(2)]);
  });
});
