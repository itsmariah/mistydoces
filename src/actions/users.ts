"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/generated/prisma/client";
import { toActionError } from "@/lib/errors";
import { requireAdmin } from "@/lib/require-admin";
import * as userService from "@/services/user-service";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function setUserRole(userId: string, role: Role): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await userService.setUserRole(admin.id, userId, role);
    revalidatePath("/admin/clientes");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
