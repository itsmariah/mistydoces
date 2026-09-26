import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  productVariant: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { getCartSnapshot } = await import("@/services/cart-service");

const variant = (product: Partial<{ isActive: boolean; isAvailable: boolean }> = {}, categoryActive = true) => ({
  id: "v1",
  label: "Cento",
  price: { toString: () => "89.9", valueOf: () => 89.9 },
  product: {
    slug: "brigadeiro",
    name: "Brigadeiro",
    imageUrl: null,
    isActive: true,
    isAvailable: true,
    category: { isActive: categoryActive },
    ...product,
  },
});

describe("getCartSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrinho vazio não consulta o banco", async () => {
    expect(await getCartSnapshot([])).toEqual([]);
    expect(prismaMock.productVariant.findMany).not.toHaveBeenCalled();
  });

  it("devolve os dados atuais da variação", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([variant()]);

    expect(await getCartSnapshot(["v1"])).toEqual([
      {
        variantId: "v1",
        productSlug: "brigadeiro",
        productName: "Brigadeiro",
        variantLabel: "Cento",
        price: 89.9,
        imageUrl: null,
        isAvailable: true,
      },
    ]);
  });

  it("usa a mesma regra de disponibilidade do checkout", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([
      variant({ isAvailable: false }),
      variant({ isActive: false }),
      variant({}, false),
    ]);

    const snapshots = await getCartSnapshot(["v1"]);
    expect(snapshots.map((s) => s.isAvailable)).toEqual([false, false, false]);
  });
});
