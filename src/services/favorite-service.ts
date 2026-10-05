import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FAVORITES_COOKIE, MAX_FAVORITES, parseFavoritesCookie } from "@/lib/favorites";

/** Favoritos de um cliente logado, do mais recente para o mais antigo. */
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
    take: MAX_FAVORITES,
  });
  return rows.map((row) => row.productId);
}

/** Só produtos que existem e estão no cardápio podem virar favorito. */
async function visibleProductIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, category: { isActive: true } },
    select: { id: true },
  });
  const visible = new Set(products.map((product) => product.id));
  return ids.filter((id) => visible.has(id));
}

export async function setUserFavorite(userId: string, productId: string, favorite: boolean) {
  if (!favorite) {
    await prisma.favorite.deleteMany({ where: { userId, productId } });
    return;
  }
  const [visible] = await visibleProductIds([productId]);
  if (!visible) return;
  await prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

/** Junta os favoritos do cookie de visitante aos da conta (sem duplicar). */
export async function mergeGuestFavorites(userId: string, guestIds: string[]) {
  const ids = await visibleProductIds(guestIds);
  if (ids.length === 0) return;
  await prisma.favorite.createMany({
    data: ids.map((productId) => ({ userId, productId })),
    skipDuplicates: true,
  });
}

/**
 * Favoritos de quem está vendo a página: da conta, se logado; do cookie, se visitante.
 * `pendingGuestIds` são os do cookie que ainda não foram juntados à conta (logo após o login).
 */
export async function getCurrentFavorites(): Promise<{
  ids: string[];
  isLoggedIn: boolean;
  pendingGuestIds: string[];
}> {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const guestIds = parseFavoritesCookie(cookieStore.get(FAVORITES_COOKIE)?.value);

  if (!session?.user) return { ids: guestIds, isLoggedIn: false, pendingGuestIds: [] };

  const accountIds = await getUserFavoriteIds(session.user.id);
  // Até a junção terminar, mostra os dois juntos — o coração não "apaga" depois do login.
  const ids = [...new Set([...accountIds, ...guestIds])];
  return { ids, isLoggedIn: true, pendingGuestIds: guestIds };
}
