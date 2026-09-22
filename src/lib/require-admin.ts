import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

/** Reforça a checagem de role no backend (RNF05) — nunca confia só na rota. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN") throw new ForbiddenError();
  return session.user;
}
