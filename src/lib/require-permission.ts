import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { adminHomePath, can, type Permission } from "@/lib/permissions";

/** Reforça a checagem de permissão no backend (RNF05) — nunca confia só na rota ou na UI. */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (!can(session.user.role, permission)) throw new ForbiddenError();
  return session.user;
}

/**
 * Versão para páginas do painel: em vez de lançar erro, manda quem não tem a
 * permissão para a página inicial do seu nível (o proxy já garante que é da equipe).
 */
export async function requirePagePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, permission)) redirect(adminHomePath(session.user.role));
  return session.user;
}
