import { describe, expect, it } from "vitest";
import {
  cartLineKey,
  normalizeNote,
  parseStoredCart,
  planReorder,
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
  leadTimeDays: 0,
  note: "",
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
  leadTimeDays: 0,
  allowsNote: false,
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

describe("planReorder", () => {
  const snapshot = (overrides: Partial<CartVariantSnapshot> = {}): CartVariantSnapshot => ({
    variantId: "v1",
    productSlug: "brigadeiro",
    productName: "Brigadeiro",
    variantLabel: "Cento",
    price: 120,
    imageUrl: null,
    isAvailable: true,
    leadTimeDays: 0,
    allowsNote: false,
    ...overrides,
  });

  it("repete as quantidades do pedido com o preço de hoje", () => {
    const { toAdd, skipped } = planReorder(
      [{ variantId: "v1", quantity: 3, productName: "Brigadeiro" }],
      [snapshot()],
    );
    expect(toAdd).toEqual([{ snapshot: snapshot(), quantity: 3, note: "" }]);
    expect(skipped).toEqual([]);
  });

  it("deixa de fora o que está esgotado ou saiu do cardápio", () => {
    const { toAdd, skipped } = planReorder(
      [
        { variantId: "v1", quantity: 1, productName: "Brigadeiro" },
        { variantId: "v2", quantity: 1, productName: "Bolo antigo" },
        { variantId: "v3", quantity: 2, productName: "Cookie" },
      ],
      [
        snapshot(),
        snapshot({ variantId: "v3", productName: "Cookie", isAvailable: false }),
      ],
    );
    expect(toAdd.map((line) => line.snapshot.variantId)).toEqual(["v1"]);
    expect(skipped).toEqual(["Bolo antigo", "Cookie"]);
  });
});

describe("prazo de encomenda no carrinho", () => {
  it("carrinho salvo antes do prazo existir vira pronta-entrega", () => {
    const { leadTimeDays, ...legacy } = item();
    expect(leadTimeDays).toBe(0);
    expect(parseStoredCart(JSON.stringify([legacy]))[0].leadTimeDays).toBe(0);
  });

  it("a conferência traz o prazo atual do produto", () => {
    const { items } = reconcileCart([item()], [snapshot({ leadTimeDays: 2 })], ["v1"]);
    expect(items[0].leadTimeDays).toBe(2);
  });
});

describe("personalização por item", () => {
  it("normaliza espaços e corta no limite", () => {
    expect(normalizeNote("  Parabéns,   Ana!  ")).toBe("Parabéns, Ana!");
    expect(normalizeNote("x".repeat(200))).toHaveLength(120);
  });

  it("mesma variação com textos diferentes são linhas diferentes", () => {
    expect(cartLineKey(item({ note: "Ana" }))).not.toBe(cartLineKey(item({ note: "João" })));
    expect(cartLineKey(item())).toBe(cartLineKey(item({ note: "" })));
  });

  it("carrinho antigo, sem o campo, vira sem personalização", () => {
    const { note, ...legacy } = item();
    expect(note).toBe("");
    expect(parseStoredCart(JSON.stringify([legacy]))[0].note).toBe("");
  });

  it("mantém o texto enquanto o produto aceita; se deixar de aceitar, tira e junta as linhas", () => {
    const lines = [item({ note: "Ana", quantity: 1 }), item({ note: "João", quantity: 2 })];

    const kept = reconcileCart(lines, [snapshot({ allowsNote: true })], ["v1"]);
    expect(kept.items.map((line) => line.note)).toEqual(["Ana", "João"]);

    const dropped = reconcileCart(lines, [snapshot({ allowsNote: false })], ["v1"]);
    expect(dropped.items).toHaveLength(1);
    expect(dropped.items[0]).toMatchObject({ note: "", quantity: 3 });
  });

  it("pedir de novo repete o texto só se o produto ainda aceitar", () => {
    const line = { variantId: "v1", quantity: 1, productName: "Bolo", note: " Ana " };
    expect(planReorder([line], [snapshot({ allowsNote: true })]).toAdd[0].note).toBe("Ana");
    expect(planReorder([line], [snapshot({ allowsNote: false })]).toAdd[0].note).toBe("");
  });
});
