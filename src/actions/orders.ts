"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError, toActionError } from "@/lib/errors";
import * as orderService from "@/services/order-service";
import { checkoutSchema } from "@/validations/order";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function createOrder(
  input: unknown,
): Promise<ActionResult<{ orderId: string }>> {
  const parsed = checkoutSchema.safeParse(input);
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

    const order = await orderService.createOrder(session.user.id, parsed.data);

    revalidatePath("/conta/pedidos");
    return { success: true, data: { orderId: order.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    await orderService.cancelOrder(session.user.id, orderId);

    revalidatePath("/conta/pedidos");
    revalidatePath(`/conta/pedidos/${orderId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
