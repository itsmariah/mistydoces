"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as couponService from "@/services/coupon-service";
import { couponSchema } from "@/validations/coupon";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function parseInput(input: unknown) {
  return couponSchema.safeParse(input);
}

export async function createCoupon(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(input);
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
    await requirePermission("coupons:edit");
    const coupon = await couponService.createCoupon(parsed.data);
    revalidatePath("/admin/cupons");
    return { success: true, data: { id: coupon.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateCoupon(
  couponId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = parseInput(input);
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
    await requirePermission("coupons:edit");
    await couponService.updateCoupon(couponId, parsed.data);
    revalidatePath("/admin/cupons");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  try {
    await requirePermission("coupons:delete");
    await couponService.deleteCoupon(couponId);
    revalidatePath("/admin/cupons");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
