"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import * as userService from "@/services/user-service";
import { roleChangeSchema, teamMemberSchema } from "@/validations/team";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function revalidateTeamPaths() {
  revalidatePath("/admin/equipe");
  revalidatePath("/admin/clientes");
}

export async function setUserRole(userId: string, role: unknown): Promise<ActionResult> {
  const parsed = roleChangeSchema.safeParse(role);
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
    const admin = await requirePermission("team:manage");
    await userService.setUserRole(admin.id, userId, parsed.data);
    revalidateTeamPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function addTeamMember(input: unknown): Promise<ActionResult> {
  const parsed = teamMemberSchema.safeParse(input);
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
    const admin = await requirePermission("team:manage");
    await userService.addTeamMember(admin.id, parsed.data.email, parsed.data.role);
    revalidateTeamPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
