"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError, toActionError } from "@/lib/errors";
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
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();
    if (session.user.role !== "ADMIN") throw new ForbiddenError();

    await upsertStoreSettings(parsed.data);

    revalidatePath("/admin/configuracoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
