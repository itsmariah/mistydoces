import { describe, expect, it } from "vitest";
import {
  parseStoredCart,
  reconcileCart,
  serializeCart,
  type CartItem,
  type CartVariantSnapshot,
} from "@/lib/cart";

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: "v1",
  productSlug: "brigadeiro",
  productName: "Brigadeiro",
  variantLabel: "Cento",
  price: 100,
  imageUrl: null,
  quantity: 2,
  isAvailable: true,
  ...overrides,
});

const snapshot = (overrides: Partial<CartVariantSnapshot> = {}): CartVariantSnapshot => ({
  variantId: "v1",
  productSlug: "brigadeiro",
  productName: "Brigadeiro",
  variantLabel: "Cento",
  price: 100,
  imageUrl: null,
  isAvailable: true,
  ...overrides,
});

describe("parseStoredCart", () => {
  it("lê o formato atual (com versão)", () => {
    const items = [item()];
    expect(parseStoredCart(serializeCart(items))).toEqual(items);
  });

  it("aproveita o formato antigo (lista sem versão e sem isAvailable)", () => {
    const legacy: Record<string, unknown> = { ...item() };
    delete legacy.isAvailable;
    expect(parseStoredCart(JSON.stringify([legacy]))).toEqual([item()]);
  });

  it("descarta dados inválidos em vez de quebrar a página", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("{não é json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ version: 99, items: [] }))).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ variantId: "v1", quantity: "muitos" }]))).toEqual([]);
    expect(parseStoredCart(JSON.stringify([item({ quantity: 0 })]))).toEqual([]);
  });
});

describe("reconcileCart", () => {
  it("atualiza preço, nome e foto mantendo a quantidade", () => {
    const result = reconcileCart(
      [item()],
      [snapshot({ price: 120, productName: "Brigadeiro gourmet", imageUrl: "https://x/y.jpg" })],
      ["v1"],
    );

    expect(result.items).toEqual([
      item({ price: 120, productName: "Brigadeiro gourmet", imageUrl: "https://x/y.jpg" }),
    ]);
    expect(result.priceChanged).toEqual([{ item: result.items[0], previousPrice: 100 }]);
  });

  it("remove variações que não existem mais", () => {
    const result = reconcileCart([item(), item({ variantId: "v2" })], [snapshot()], ["v1", "v2"]);

    expect(result.items.map((i) => i.variantId)).toEqual(["v1"]);
    expect(result.removed.map((i) => i.variantId)).toEqual(["v2"]);
  });

  it("marca como indisponível e só avisa na primeira vez", () => {
    const first = reconcileCart([item()], [snapshot({ isAvailable: false })], ["v1"]);
    expect(first.items[0].isAvailable).toBe(false);
    expect(first.becameUnavailable).toHaveLength(1);

    const second = reconcileCart(first.items, [snapshot({ isAvailable: false })], ["v1"]);
    expect(second.becameUnavailable).toHaveLength(0);
  });

  it("volta a ficar disponível quando a loja reabastece", () => {
    const result = reconcileCart([item({ isAvailable: false })], [snapshot()], ["v1"]);
    expect(result.items[0].isAvailable).toBe(true);
  });

  it("não remove item adicionado enquanto a conferência estava em andamento", () => {
    const added = item({ variantId: "v-novo" });
    const result = reconcileCart([item(), added], [snapshot()], ["v1"]);

    expect(result.items).toContainEqual(added);
    expect(result.removed).toHaveLength(0);
  });

  it("sem mudanças, não gera avisos", () => {
    const result = reconcileCart([item()], [snapshot()], ["v1"]);
    expect(result).toMatchObject({ removed: [], priceChanged: [], becameUnavailable: [] });
  });
});
