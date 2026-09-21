"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError, UnauthorizedError, toActionError } from "@/lib/errors";
import { changePasswordSchema, updateProfileSchema } from "@/validations/auth";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
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

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone },
    });

    revalidatePath("/conta");
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
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

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
    });

    const matches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new AppError("INVALID_PASSWORD", "Senha atual incorreta.", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
