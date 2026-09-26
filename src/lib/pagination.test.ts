import { describe, expect, it } from "vitest";
import { getPageItems, parsePage } from "@/lib/pagination";

describe("getPageItems", () => {
  it("mostra todas as páginas quando são poucas", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("usa reticências dos dois lados no meio", () => {
    expect(getPageItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("mantém um bloco no começo e no fim", () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
    expect(getPageItems(12, 12)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12]);
  });
});

describe("parsePage", () => {
  it("aceita inteiros positivos", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("volta para 1 com valores inválidos", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });
});
