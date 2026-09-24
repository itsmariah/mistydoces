import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  orderItem: {
    groupBy: vi.fn(),
  },
  productVariant: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { rankBestSellers, getBestSellerProductIds } = await import(
  "@/services/best-seller-service"
);

describe("rankBestSellers", () => {
  it("soma as unidades de variantes diferentes do mesmo produto", () => {
    const result = rankBestSellers([
      { productId: "bolo", units: 2 },
      { productId: "bolo", units: 2 },
      { productId: "cookie", units: 3 },
    ]);

    expect([...result]).toEqual(["bolo", "cookie"]);
  });

  it("ignora produtos abaixo do mínimo de unidades", () => {
    const result = rankBestSellers([
      { productId: "bolo", units: 5 },
      { productId: "cookie", units: 2 },
    ]);

    expect(result.has("cookie")).toBe(false);
    expect(result.has("bolo")).toBe(true);
  });

  it("limita o selo aos 3 mais vendidos", () => {
    const result = rankBestSellers([
      { productId: "a", units: 10 },
      { productId: "b", units: 9 },
      { productId: "c", units: 8 },
      { productId: "d", units: 7 },
    ]);

    expect([...result]).toEqual(["a", "b", "c"]);
  });

  it("desempata pelo id para o resultado ser estável", () => {
    const result = rankBestSellers([
      { productId: "d", units: 5 },
      { productId: "c", units: 5 },
      { productId: "b", units: 5 },
      { productId: "a", units: 5 },
    ]);

    expect([...result]).toEqual(["a", "b", "c"]);
  });
});

describe("getBestSellerProductIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conta só pedidos aceitos pela loja dentro da janela de 90 dias", async () => {
    prismaMock.orderItem.groupBy.mockResolvedValue([]);
    const now = new Date("2026-09-24T12:00:00Z");

    await getBestSellerProductIds(now);

    const { where } = prismaMock.orderItem.groupBy.mock.calls[0][0];
    expect(where.order.status.in).not.toContain("PENDING");
    expect(where.order.status.in).not.toContain("CANCELLED");
    expect(where.order.createdAt.gte).toEqual(new Date("2026-06-26T12:00:00Z"));
    expect(prismaMock.productVariant.findMany).not.toHaveBeenCalled();
  });

  it("agrupa as vendas das variantes pelo produto", async () => {
    prismaMock.orderItem.groupBy.mockResolvedValue([
      { variantId: "bolo-p", _sum: { quantity: 2 } },
      { variantId: "bolo-g", _sum: { quantity: 1 } },
      { variantId: "cookie-un", _sum: { quantity: 1 } },
    ]);
    prismaMock.productVariant.findMany.mockResolvedValue([
      { id: "bolo-p", productId: "bolo" },
      { id: "bolo-g", productId: "bolo" },
      { id: "cookie-un", productId: "cookie" },
    ]);

    const result = await getBestSellerProductIds();

    expect([...result]).toEqual(["bolo"]);
  });
});
