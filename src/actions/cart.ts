"use server";

import { z } from "zod";
import { toActionError } from "@/lib/errors";
import type { CartVariantSnapshot } from "@/lib/cart";
import * as cartService from "@/services/cart-service";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Público de propósito: visitante também tem carrinho. Só lê dados que já aparecem no cardápio.
const refreshCartSchema = z.array(z.string().min(1).max(64)).max(100);

export async function refreshCart(
  variantIds: unknown,
): Promise<ActionResult<CartVariantSnapshot[]>> {
  const parsed = refreshCartSchema.safeParse(variantIds);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Dados inválidos." } };
  }

  try {
    return { success: true, data: await cartService.getCartSnapshot(parsed.data) };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
