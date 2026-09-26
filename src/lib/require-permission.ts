import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { can, type Permission } from "@/lib/permissions";

/** Reforça a checagem de permissão no backend (RNF05) — nunca confia só na rota ou na UI. */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (!can(session.user.role, permission)) throw new ForbiddenError();
  return session.user;
}
