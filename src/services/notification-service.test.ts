import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/resend", () => ({
  EMAIL_FROM: "MistyDoces <onboarding@resend.dev>",
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = await import(
  "@/services/notification-service"
);

const order = { id: "order-1", orderNumber: 42, total: "35.50" };
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

  it("nunca propaga erro quando o envio falha (não pode derrubar o pedido)", async () => {
    sendMock.mockRejectedValue(new Error("Resend indisponível"));

    await expect(sendOrderConfirmationEmail(order, user)).resolves.toBeUndefined();
    await expect(
      sendOrderStatusUpdateEmail(order, user, "CONFIRMED"),
    ).resolves.toBeUndefined();
  });
});
