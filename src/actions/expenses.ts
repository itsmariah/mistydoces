"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as financeService from "@/services/finance-service";
import { expenseSchema } from "@/validations/expense";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function validationError(message?: string): ActionResult<never> {
  return {
    success: false,
    error: { code: "VALIDATION_ERROR", message: message ?? "Dados inválidos." },
  };
}

export async function createExpense(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message);

  try {
    const user = await requirePermission("finance:manage");
    const expense = await financeService.createExpense(parsed.data, user.id);
    await financeService.checkBreakEven();
    revalidatePath("/admin/financeiro");
    return { success: true, data: { id: expense.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function updateExpense(expenseId: string, input: unknown): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues[0]?.message);

  try {
    await requirePermission("finance:manage");
    await financeService.updateExpense(expenseId, parsed.data);
    await financeService.checkBreakEven();
    revalidatePath("/admin/financeiro");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  try {
    await requirePermission("finance:manage");
    await financeService.deleteExpense(expenseId);
    await financeService.checkBreakEven();
    revalidatePath("/admin/financeiro");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
