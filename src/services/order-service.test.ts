import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  address: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  productVariant: {
    findMany: vi.fn(),
  },
  storeSettings: {
    findUnique: vi.fn(),
  },
  order: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { createOrder } = await import("@/services/order-service");
const { ProductUnavailableError, NotFoundError } = await import("@/lib/errors");

function buildVariant(overrides: {
  isActive?: boolean;
  isAvailable?: boolean;
  categoryActive?: boolean;
} = {}) {
  return {
    id: "variant-1",
    label: "Unidade",
    price: "4.10",
    product: {
      name: "Brigadeiro Tradicional",
      isActive: overrides.isActive ?? true,
      isAvailable: overrides.isAvailable ?? true,
      category: { isActive: overrides.categoryActive ?? true },
    },
  };
}

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.order.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "order-1", ...data }),
    );
  });

  it("calcula subtotal e total em centavos, sem erro de ponto flutuante", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant()]);

    await createOrder("user-1", {
      items: [{ variantId: "variant-1", quantity: 3 }],
      deliveryType: "PICKUP",
      paymentMethod: "CASH",
    });

    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: 12.3, deliveryFee: 0, total: 12.3 }),
      }),
    );
  });

  it("soma a taxa de entrega apenas quando deliveryType é DELIVERY", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant()]);
    prismaMock.storeSettings.findUnique.mockResolvedValue({ deliveryFee: "5.00" });
    prismaMock.address.findUnique.mockResolvedValue({ id: "addr-1", userId: "user-1" });
    prismaMock.address.findUniqueOrThrow.mockResolvedValue({
      id: "addr-1",
      label: "Casa",
      street: "Rua A",
      number: "10",
      complement: "Apto 1",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      reference: "Perto do mercado",
    });

    await createOrder("user-1", {
      items: [{ variantId: "variant-1", quantity: 1 }],
      deliveryType: "DELIVERY",
      addressId: "addr-1",
      paymentMethod: "PIX_MANUAL",
    });

    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: 4.1, deliveryFee: 5, total: 9.1 }),
      }),
    );
  });

  it("rejeita item de produto inativo", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant({ isActive: false })]);

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-1", quantity: 1 }],
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
      }),
    ).rejects.toBeInstanceOf(ProductUnavailableError);
  });

  it("rejeita item esgotado (isAvailable=false)", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant({ isAvailable: false })]);

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-1", quantity: 1 }],
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
      }),
    ).rejects.toBeInstanceOf(ProductUnavailableError);
  });

  it("rejeita item de categoria desativada", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([
      buildVariant({ categoryActive: false }),
    ]);

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-1", quantity: 1 }],
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
      }),
    ).rejects.toBeInstanceOf(ProductUnavailableError);
  });

  it("rejeita variante que não existe mais", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([]);

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-inexistente", quantity: 1 }],
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejeita endereço que não pertence ao usuário", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant()]);
    prismaMock.address.findUnique.mockResolvedValue({ id: "addr-1", userId: "outro-user" });

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-1", quantity: 1 }],
        deliveryType: "DELIVERY",
        addressId: "addr-1",
        paymentMethod: "CASH",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
