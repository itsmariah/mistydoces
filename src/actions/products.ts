"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requireAdmin } from "@/lib/require-admin";
import * as productService from "@/services/product-service";
import { productSchema } from "@/validations/product";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function revalidateProductPaths(productId?: string) {
  revalidatePath("/admin/produtos");
  revalidatePath("/cardapio");
  if (productId) revalidatePath(`/admin/produtos/${productId}`);
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(input);
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
    await requireAdmin();
    const product = await productService.createProduct(parsed.data);
    revalidateProductPaths();
    return { success: true, data: { id: product.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateProduct(
  productId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
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
    await requireAdmin();
    await productService.updateProduct(productId, parsed.data);
    revalidateProductPaths(productId);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
