import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/errors";
import type { Role } from "@/generated/prisma/client";

export function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function setUserRole(actingAdminId: string, userId: string, role: Role) {
  if (actingAdminId === userId) {
    throw new AppError(
      "CANNOT_CHANGE_OWN_ROLE",
      "Você não pode alterar seu próprio papel de acesso.",
      400,
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado.");

  return prisma.user.update({ where: { id: userId }, data: { role } });
}
