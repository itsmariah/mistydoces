import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/resend", () => ({
  EMAIL_FROM: "MistyDoces <onboarding@resend.dev>",
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@/services/store-settings-service", () => ({
  getStoreContact: async () => ({ whatsappHref: "https://wa.me/5583999999999" }),
}));

const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, statusLabelFor } = await import(
  "@/services/notification-service"
);

const order = {
  id: "order-1",
  orderNumber: 42,
  total: "35.50",
  deliveryType: "DELIVERY" as const,
  items: [
    { quantity: 2, productNameSnapshot: "Brigadeiro", variantLabelSnapshot: "Único", subtotal: "10.00" },
  ],
};
const user = { name: "Maria", email: "maria@example.com" };

describe("notification-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia e-mail de confirmação com os dados do pedido", async () => {
    sendMock.mockResolvedValue({ id: "email-1" });

    await sendOrderConfirmationEmail(order, user);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "maria@example.com" }),
    );
  });

  it("monta o e-mail com a marca, os itens, o WhatsApp da loja e versão em texto", async () => {
    sendMock.mockResolvedValue({ id: "email-1" });

    await sendOrderConfirmationEmail(order, { ...user, name: "Maria <b>Silva</b>" });

    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain("2x Brigadeiro (Único)");
    expect(payload.html).toContain("https://wa.me/5583999999999");
    expect(payload.html).toContain("Olá, Maria!");
    expect(payload.html).not.toContain("<b>");
    expect(payload.text).toContain("Acompanhar pedido");
  });

  it("chama de \"Retirado\" o pedido de retirada entregue", () => {
    expect(statusLabelFor("DELIVERED", "PICKUP")).toBe("Retirado");
    expect(statusLabelFor("DELIVERED", "DELIVERY")).toBe("Entregue");
    expect(statusLabelFor("READY", "PICKUP")).toBe("Pronto");
  });

  it("depois de entregue, convida para avaliar", async () => {
    sendMock.mockResolvedValue({ id: "email-2" });

    await sendOrderStatusUpdateEmail({ ...order, deliveryType: "PICKUP" }, user, "DELIVERED");

    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toBe("Pedido #42: Retirado — MistyDoces");
    expect(payload.html).toContain("Avaliar meus doces");
  });

  it("nunca propaga erro quando o envio falha (não pode derrubar o pedido)", async () => {
    sendMock.mockRejectedValue(new Error("Resend indisponível"));

    await expect(sendOrderConfirmationEmail(order, user)).resolves.toBeUndefined();
    await expect(
      sendOrderStatusUpdateEmail(order, user, "CONFIRMED"),
    ).resolves.toBeUndefined();
  });
});
