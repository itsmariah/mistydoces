import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/errors";
import { ROLE_LABELS, type StaffRole } from "@/lib/permissions";
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

export function listTeam() {
  return prisma.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
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

  return prisma.$transaction(async (tx) => {
    // Trava as linhas dos proprietários: se dois deles se rebaixarem ao mesmo
    // tempo, o segundo espera o primeiro e já enxerga a contagem atualizada.
    const owners = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE role = 'OWNER' FOR UPDATE
    `;

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("Usuário não encontrado.");

    if (user.role === "OWNER" && role !== "OWNER" && owners.length <= 1) {
      throw new AppError(
        "LAST_OWNER",
        "A loja precisa de pelo menos um proprietário.",
        409,
      );
    }

    return tx.user.update({ where: { id: userId }, data: { role } });
  });
}

/** Coloca na equipe uma conta já cadastrada no site, encontrada pelo e-mail. */
export async function addTeamMember(actingAdminId: string, email: string, role: StaffRole) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    throw new NotFoundError(
      "Nenhuma conta com esse e-mail. A pessoa precisa se cadastrar no site primeiro.",
    );
  }
  if (user.role !== "CUSTOMER") {
    throw new AppError(
      "ALREADY_IN_TEAM",
      `${user.name} já faz parte da equipe como ${ROLE_LABELS[user.role]}.`,
      409,
    );
  }

  return setUserRole(actingAdminId, user.id, role);
}
