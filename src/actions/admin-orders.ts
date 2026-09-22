"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/generated/prisma/client";
import { toActionError } from "@/lib/errors";
import { requireAdmin } from "@/lib/require-admin";
import * as orderService from "@/services/order-service";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await orderService.adminUpdateOrderStatus(orderId, status);
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/conta/pedidos");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function markPaymentPaid(orderId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await orderService.adminMarkPaymentPaid(orderId);
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/conta/pedidos");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
