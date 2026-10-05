import { describe, expect, it } from "vitest";
import {
  RECENTLY_VIEWED_LIMIT,
  parseRecentlyViewed,
  pushRecentlyViewed,
} from "@/lib/recently-viewed";

describe("parseRecentlyViewed", () => {
  it("devolve lista vazia para nada guardado, JSON quebrado ou formato inesperado", () => {
    expect(parseRecentlyViewed(null)).toEqual([]);
    expect(parseRecentlyViewed("{oops")).toEqual([]);
    expect(parseRecentlyViewed(JSON.stringify({ slug: "brigadeiro" }))).toEqual([]);
    expect(parseRecentlyViewed(JSON.stringify([1, 2]))).toEqual([]);
  });

  it("lê os slugs guardados, cortando no limite", () => {
    const many = Array.from({ length: RECENTLY_VIEWED_LIMIT + 3 }, (_, i) => `doce-${i}`);
    expect(parseRecentlyViewed(JSON.stringify(["brigadeiro", "bolo"]))).toEqual([
      "brigadeiro",
      "bolo",
    ]);
    expect(parseRecentlyViewed(JSON.stringify(many))).toHaveLength(RECENTLY_VIEWED_LIMIT);
  });
});

describe("pushRecentlyViewed", () => {
  it("coloca o produto na frente sem repetir", () => {
    expect(pushRecentlyViewed(["bolo", "brigadeiro", "cookie"], "brigadeiro")).toEqual([
      "brigadeiro",
      "bolo",
      "cookie",
    ]);
  });

  it("descarta o mais antigo quando passa do limite", () => {
    const full = Array.from({ length: RECENTLY_VIEWED_LIMIT }, (_, i) => `doce-${i}`);
    const result = pushRecentlyViewed(full, "novo");
    expect(result).toHaveLength(RECENTLY_VIEWED_LIMIT);
    expect(result[0]).toBe("novo");
    expect(result).not.toContain(`doce-${RECENTLY_VIEWED_LIMIT - 1}`);
  });
});
