"use server";

import { z } from "zod";
import { toActionError } from "@/lib/errors";
import { getProductsBySlugs } from "@/lib/catalog";
import { RECENTLY_VIEWED_LIMIT } from "@/lib/recently-viewed";
import { getStartingPrice } from "@/lib/utils";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export type RecentlyViewedProduct = {
  slug: string;
  name: string;
  imageUrl: string | null;
  startingPrice: number;
  hasOptions: boolean;
  isAvailable: boolean;
};

// Público de propósito: os slugs vêm do localStorage do visitante e só lê o que já está no cardápio.
const slugsSchema = z.array(z.string().min(1).max(200)).max(RECENTLY_VIEWED_LIMIT);

export async function getRecentlyViewedProducts(
  slugs: unknown,
): Promise<ActionResult<RecentlyViewedProduct[]>> {
  const parsed = slugsSchema.safeParse(slugs);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Dados inválidos." } };
  }

  try {
    const products = await getProductsBySlugs(parsed.data);
    return {
      success: true,
      data: products.map((product) => ({
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        startingPrice: getStartingPrice(product.variants),
        hasOptions: product.variants.length > 1,
        isAvailable: product.isAvailable,
      })),
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
