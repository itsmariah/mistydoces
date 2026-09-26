"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as categoryService from "@/services/category-service";
import { categorySchema } from "@/validations/category";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function parseInput(input: unknown) {
  return categorySchema.safeParse(input);
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categorias");
  revalidatePath("/cardapio");
}

export async function createCategory(
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
    await requirePermission("categories:edit");
    const category = await categoryService.createCategory(parsed.data);
    revalidateCategoryPaths();
    return { success: true, data: { id: category.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateCategory(
  categoryId: string,
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
    await requirePermission("categories:edit");
    await categoryService.updateCategory(categoryId, parsed.data);
    revalidateCategoryPaths();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    await requirePermission("categories:delete");
    await categoryService.deleteCategory(categoryId);
    revalidateCategoryPaths();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
