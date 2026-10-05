"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { toActionError } from "@/lib/errors";
import {
  FAVORITES_COOKIE,
  parseFavoritesCookie,
  serializeFavoritesCookie,
  toggleFavoriteId,
} from "@/lib/favorites";
import * as favoriteService from "@/services/favorite-service";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

const toggleSchema = z.object({ productId: z.string().min(1).max(64), favorite: z.boolean() });

/** Público: visitante também favorita (no cookie); logado, vai para a conta. */
export async function setFavorite(input: unknown): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Dados inválidos." } };
  }

  try {
    const { productId, favorite } = parsed.data;
    const session = await auth();
    if (session?.user) {
      await favoriteService.setUserFavorite(session.user.id, productId, favorite);
      return { success: true };
    }

    const cookieStore = await cookies();
    const current = parseFavoritesCookie(cookieStore.get(FAVORITES_COOKIE)?.value);
    cookieStore.set(FAVORITES_COOKIE, serializeFavoritesCookie(toggleFavoriteId(current, productId, favorite)), {
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

/** Depois do login: leva os favoritos de visitante para a conta e apaga o cookie. */
export async function syncGuestFavorites(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: true };

    const cookieStore = await cookies();
    const guestIds = parseFavoritesCookie(cookieStore.get(FAVORITES_COOKIE)?.value);
    if (guestIds.length > 0) {
      await favoriteService.mergeGuestFavorites(session.user.id, guestIds);
    }
    cookieStore.delete(FAVORITES_COOKIE);
    return { success: true };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
