import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { EMAIL_FROM, getResendClient } from "@/lib/resend";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Nunca revela se o e-mail existe ou não (evita enumeração de contas) —
  // segue em silêncio quando não encontra o usuário.
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;

  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: "Redefinir sua senha — MistyDoces",
    html: `
      <p>Olá, ${user.name}!</p>
      <p>Recebemos um pedido para redefinir sua senha. O link abaixo é válido por 1 hora:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
    `,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(
      "INVALID_RESET_TOKEN",
      "Este link de redefinição é inválido ou expirou. Solicite um novo.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
