"use server";

import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import * as passwordResetService from "@/services/password-reset-service";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/validations/auth";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
    };
  }

  const { name, email, phone, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("EMAIL_TAKEN", "Este e-mail já está cadastrado.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, phone, passwordHash } });

    await signIn("credentials", { email, password, redirect: false });

    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
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
    // Sempre responde com sucesso, exista ou não o e-mail (evita enumeração de contas).
    await passwordResetService.requestPasswordReset(parsed.data.email);
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
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
    await passwordResetService.resetPassword(parsed.data.token, parsed.data.newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
