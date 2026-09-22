"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requireAdmin } from "@/lib/require-admin";
import { upsertStoreSettings } from "@/services/store-settings-service";
import { storeSettingsSchema } from "@/validations/store-settings";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function updateStoreSettings(input: unknown): Promise<ActionResult> {
  const parsed = storeSettingsSchema.safeParse(input);
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

    await upsertStoreSettings(parsed.data);

    revalidatePath("/admin/configuracoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
