import { beforeEach, describe, expect, it, vi } from "vitest";

const paymentGetMock = vi.fn();
const paymentCreateMock = vi.fn();

class FakeInvalidWebhookSignatureError extends Error {}

vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn().mockImplementation(() => ({
    get: paymentGetMock,
    create: paymentCreateMock,
  })),
  WebhookSignatureValidator: { validate: vi.fn() },
  InvalidWebhookSignatureError: FakeInvalidWebhookSignatureError,
}));

const prismaMock = {
  order: { findUnique: vi.fn() },
  payment: { update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/mercado-pago", () => ({ mercadoPagoClient: {} }));

const applyGatewayPaymentUpdateMock = vi.fn();
vi.mock("@/services/order-service", () => ({
  applyGatewayPaymentUpdate: applyGatewayPaymentUpdateMock,
}));

const { mapExternalStatus, createPixPayment, processWebhookNotification } = await import(
  "@/services/payment-service"
);
const { WebhookSignatureValidator } = await import("mercadopago");
const { AppError, ForbiddenError, NotFoundError } = await import("@/lib/errors");

describe("mapExternalStatus", () => {
  it("mapeia status aprovado para PAID", () => {
    expect(mapExternalStatus("approved")).toBe("PAID");
  });

  it("mapeia status em andamento para PROCESSING", () => {
    expect(mapExternalStatus("pending")).toBe("PROCESSING");
    expect(mapExternalStatus("in_process")).toBe("PROCESSING");
    expect(mapExternalStatus("authorized")).toBe("PROCESSING");
  });

  it("mapeia status de recusa/estorno para FAILED", () => {
    expect(mapExternalStatus("rejected")).toBe("FAILED");
    expect(mapExternalStatus("cancelled")).toBe("FAILED");
    expect(mapExternalStatus("refunded")).toBe("FAILED");
    expect(mapExternalStatus("charged_back")).toBe("FAILED");
  });

  it("usa PENDING como fallback para status desconhecido", () => {
    expect(mapExternalStatus(undefined)).toBe("PENDING");
    expect(mapExternalStatus("algo_novo_da_api")).toBe("PENDING");
  });
});

describe("createPixPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: "order-1",
      orderNumber: 42,
      userId: "user-1",
      total: "35.50",
      user: { name: "Maria Silva", email: "maria@example.com" },
      payment: {
        id: "payment-1",
        method: "PIX_ONLINE",
        status: "PENDING",
        externalId: null,
        pixQrCode: null,
        pixQrCodeBase64: null,
        pixExpiresAt: null,
      },
      ...overrides,
    };
  }

  it("rejeita pedido de outro usuário", async () => {
    prismaMock.order.findUnique.mockResolvedValue(buildOrder({ userId: "outro-user" }));

    await expect(createPixPayment("user-1", "order-1", "111.444.777-35")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("rejeita pedido que não usa Pix online", async () => {
    prismaMock.order.findUnique.mockResolvedValue(
      buildOrder({ payment: { ...buildOrder().payment, method: "CASH" } }),
    );

    await expect(createPixPayment("user-1", "order-1", "111.444.777-35")).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("rejeita pedido inexistente", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(createPixPayment("user-1", "order-1", "111.444.777-35")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("reaproveita o QR code existente e não chama a API do MP de novo", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prismaMock.order.findUnique.mockResolvedValue(
      buildOrder({
        payment: {
          id: "payment-1",
          method: "PIX_ONLINE",
          status: "PROCESSING",
          externalId: "mp-999",
          pixQrCode: "00020126...",
          pixQrCodeBase64: "base64...",
          pixExpiresAt: expiresAt,
        },
      }),
    );

    const result = await createPixPayment("user-1", "order-1", "111.444.777-35");

    expect(paymentCreateMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      qrCode: "00020126...",
      qrCodeBase64: "base64...",
      expiresAt,
      status: "PROCESSING",
    });
  });

  it("gera uma nova cobrança quando a anterior expirou e persiste os dados retornados", async () => {
    const expiredAt = new Date(Date.now() - 60_000);
    prismaMock.order.findUnique.mockResolvedValue(
      buildOrder({
        payment: {
          id: "payment-1",
          method: "PIX_ONLINE",
          status: "PROCESSING",
          externalId: "mp-old",
          pixQrCode: "codigo-antigo",
          pixQrCodeBase64: "base64-antigo",
          pixExpiresAt: expiredAt,
        },
      }),
    );
    paymentCreateMock.mockResolvedValue({
      id: 555,
      status: "pending",
      date_of_expiration: "2030-01-01T00:00:00.000Z",
      point_of_interaction: {
        transaction_data: { qr_code: "novo-codigo", qr_code_base64: "novo-base64" },
      },
    });

    const result = await createPixPayment("user-1", "order-1", "111.444.777-35");

    expect(paymentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          payment_method_id: "pix",
          transaction_amount: 35.5,
          payer: expect.objectContaining({
            identification: { type: "CPF", number: "11144477735" },
          }),
        }),
      }),
    );
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PROCESSING",
          provider: "MERCADO_PAGO",
          externalId: "555",
          pixQrCode: "novo-codigo",
          pixQrCodeBase64: "novo-base64",
        }),
      }),
    );
    expect(result.qrCode).toBe("novo-codigo");
    expect(result.status).toBe("PROCESSING");
  });
});

describe("processWebhookNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignora notificações que não são de pagamento", async () => {
    await processWebhookNotification({
      type: "merchant_order",
      dataId: "123",
      xSignature: "ts=1,v1=abc",
      xRequestId: "req-1",
    });

    expect(WebhookSignatureValidator.validate).not.toHaveBeenCalled();
    expect(paymentGetMock).not.toHaveBeenCalled();
  });

  it("rejeita notificação com assinatura inválida sem consultar o pedido", async () => {
    vi.mocked(WebhookSignatureValidator.validate).mockImplementation(() => {
      throw new FakeInvalidWebhookSignatureError("bad signature");
    });

    await expect(
      processWebhookNotification({
        type: "payment",
        dataId: "123",
        xSignature: "ts=1,v1=forjado",
        xRequestId: "req-1",
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(paymentGetMock).not.toHaveBeenCalled();
    expect(applyGatewayPaymentUpdateMock).not.toHaveBeenCalled();
  });

  it("busca o pagamento real na API do MP e aplica o status mapeado, nunca o do corpo bruto", async () => {
    vi.mocked(WebhookSignatureValidator.validate).mockReturnValue(undefined);
    paymentGetMock.mockResolvedValue({
      id: 999,
      status: "approved",
      external_reference: "order-1",
    });

    await processWebhookNotification({
      type: "payment",
      dataId: "999",
      xSignature: "ts=1,v1=abc",
      xRequestId: "req-1",
    });

    expect(paymentGetMock).toHaveBeenCalledWith({ id: "999" });
    expect(applyGatewayPaymentUpdateMock).toHaveBeenCalledWith("order-1", {
      status: "PAID",
      externalId: "999",
      externalStatus: "approved",
    });
  });

  it("não aplica nada quando o pagamento não tem external_reference", async () => {
    vi.mocked(WebhookSignatureValidator.validate).mockReturnValue(undefined);
    paymentGetMock.mockResolvedValue({ id: 999, status: "approved", external_reference: null });

    await processWebhookNotification({
      type: "payment",
      dataId: "999",
      xSignature: "ts=1,v1=abc",
      xRequestId: "req-1",
    });

    expect(applyGatewayPaymentUpdateMock).not.toHaveBeenCalled();
  });
});
