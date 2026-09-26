"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/generated/prisma/client";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as orderService from "@/services/order-service";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  try {
    // Cancelar tem efeito financeiro: exige permissão própria, acima de só avançar o status.
    await requirePermission(status === "CANCELLED" ? "orders:cancel" : "orders:update_status");
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
    await requirePermission("orders:mark_paid");
    await orderService.adminMarkPaymentPaid(orderId);
    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/conta/pedidos");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
