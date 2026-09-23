"use server";

import { auth } from "@/lib/auth";
import { UnauthorizedError, toActionError } from "@/lib/errors";
import * as paymentService from "@/services/payment-service";
import * as orderService from "@/services/order-service";
import { createPixPaymentSchema } from "@/validations/payment";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function createPixPayment(input: unknown): Promise<
  ActionResult<{
    qrCode: string | null;
    qrCodeBase64: string | null;
    expiresAt: Date | null;
    status: string;
  }>
> {
  const parsed = createPixPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
    };
  }

  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const result = await paymentService.createPixPayment(
      session.user.id,
      parsed.data.orderId,
      parsed.data.document,
    );
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function getOrderPaymentStatus(
  orderId: string,
): Promise<ActionResult<{ paymentStatus: string; orderStatus: string }>> {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    const order = await orderService.getUserOrderById(session.user.id, orderId);
    return {
      success: true,
      data: { paymentStatus: order.payment?.status ?? "PENDING", orderStatus: order.status },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
