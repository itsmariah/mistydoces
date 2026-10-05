import { z } from "zod";

/** Quantos produtos o "Vistos recentemente" guarda — o suficiente para uma fileira. */
export const RECENTLY_VIEWED_LIMIT = 8;

export const RECENTLY_VIEWED_STORAGE_KEY = "mistydoces-vistos";

const storedSchema = z.array(z.string().min(1).max(200));

/** Lê os slugs guardados; qualquer coisa inválida vira lista vazia. */
export function parseRecentlyViewed(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.slice(0, RECENTLY_VIEWED_LIMIT) : [];
  } catch {
    return [];
  }
}

/** Põe o produto na frente da lista, sem repetir e sem passar do limite. */
export function pushRecentlyViewed(slugs: string[], slug: string): string[] {
  return [slug, ...slugs.filter((item) => item !== slug)].slice(0, RECENTLY_VIEWED_LIMIT);
}
