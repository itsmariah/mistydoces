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
  coupon: {
    findUnique: vi.fn(),
  },
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $transaction: vi.fn((callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/notification-service", () => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendOrderStatusUpdateEmail: vi.fn(),
}));

const { createOrder, applyGatewayPaymentUpdate, adminMarkPaymentPaid } = await import(
  "@/services/order-service"
);
const { ProductUnavailableError, NotFoundError } = await import("@/lib/errors");
const notificationService = await import("@/services/notification-service");

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

  it("aplica desconto percentual do cupom sobre o subtotal, não sobre a entrega", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant()]);
    prismaMock.coupon.findUnique.mockResolvedValue({
      id: "coupon-1",
      code: "PROMO10",
      type: "PERCENTAGE",
      value: "10",
      minOrderValue: null,
      maxUses: null,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
    });
    prismaMock.$executeRaw.mockResolvedValue(1);

    await createOrder("user-1", {
      items: [{ variantId: "variant-1", quantity: 1 }],
      deliveryType: "PICKUP",
      paymentMethod: "CASH",
      couponCode: "promo10",
    });

    // subtotal 4.10, 10% de desconto = 0.41 → total 3.69 (sem taxa de entrega no PICKUP)
    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          discountAmount: 0.41,
          total: 3.69,
          couponCodeSnapshot: "PROMO10",
        }),
      }),
    );
  });

  it("rejeita cupom que já atingiu o limite de usos no momento de confirmar o pedido", async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([buildVariant()]);
    prismaMock.coupon.findUnique.mockResolvedValue({
      id: "coupon-1",
      code: "ESGOTADO",
      type: "FIXED",
      value: "5",
      minOrderValue: null,
      maxUses: 1,
      usedCount: 0,
      isActive: true,
      expiresAt: null,
    });
    // Simula outro pedido consumindo o último uso entre a validação e a confirmação.
    prismaMock.$executeRaw.mockResolvedValue(0);

    await expect(
      createOrder("user-1", {
        items: [{ variantId: "variant-1", quantity: 1 }],
        deliveryType: "PICKUP",
        paymentMethod: "CASH",
        couponCode: "ESGOTADO",
      }),
    ).rejects.toThrow(/limite de usos/);
  });
});

describe("applyGatewayPaymentUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildOrder(overrides: {
    status?: string;
    payment?: Partial<{ id: string; status: string; externalStatus: string | null; paidAt: Date | null }>;
  } = {}) {
    return {
      id: "order-1",
      userId: "user-1",
      status: overrides.status ?? "PENDING",
      payment: {
        id: "payment-1",
        status: "PENDING",
        externalStatus: null,
        paidAt: null,
        ...overrides.payment,
      },
    };
  }

  it("confirma o pedido e envia e-mail quando o pagamento é aprovado pela primeira vez", async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder());
    prismaMock.order.update.mockResolvedValue({ id: "order-1", status: "CONFIRMED" });
    prismaMock.user.findUnique.mockResolvedValue({ name: "Maria", email: "maria@example.com" });

    await applyGatewayPaymentUpdate("order-1", {
      status: "PAID",
      externalId: "mp-123",
      externalStatus: "approved",
    });

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CONFIRMED" } }),
    );
    expect(notificationService.sendOrderStatusUpdateEmail).toHaveBeenCalledWith(
      expect.objectContaining({ id: "order-1" }),
      expect.objectContaining({ email: "maria@example.com" }),
      "CONFIRMED",
    );
  });

  it("é idempotente: notificação repetida com o mesmo status não reaplica o efeito", async () => {
    prismaMock.order.findUnique.mockResolvedValue(
      buildOrder({
        payment: { status: "PAID", externalStatus: "approved", paidAt: new Date() },
      }),
    );

    await applyGatewayPaymentUpdate("order-1", {
      status: "PAID",
      externalId: "mp-123",
      externalStatus: "approved",
    });

    expect(prismaMock.payment.update).not.toHaveBeenCalled();
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("não confirma o pedido se ele não estiver mais PENDING (ex.: já cancelado)", async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder({ status: "CANCELLED" }));

    await applyGatewayPaymentUpdate("order-1", {
      status: "PAID",
      externalId: "mp-123",
      externalStatus: "approved",
    });

    expect(prismaMock.payment.update).toHaveBeenCalled();
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("registra pagamento recusado sem alterar o status do pedido", async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder());

    await applyGatewayPaymentUpdate("order-1", {
      status: "FAILED",
      externalId: "mp-123",
      externalStatus: "rejected",
    });

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });
});

describe("adminMarkPaymentPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marca como pago um pagamento sem gateway (dinheiro, Pix manual, cartão na entrega)", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({ orderId: "order-1", provider: null });
    prismaMock.payment.update.mockResolvedValue({ orderId: "order-1", status: "PAID" });

    await adminMarkPaymentPaid("order-1");

    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
  });

  it("recusa marcar manualmente um pagamento processado por gateway (Mercado Pago)", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      orderId: "order-1",
      provider: "MERCADO_PAGO",
    });

    await expect(adminMarkPaymentPaid("order-1")).rejects.toThrow(/Mercado Pago/);
    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });
});
