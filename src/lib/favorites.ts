/** Cookie com os favoritos de quem ainda não entrou na conta (ids de produto, mais novo primeiro). */
export const FAVORITES_COOKIE = "mistydoces-favoritos";

/** Teto de favoritos — o cardápio é pequeno, e o cookie precisa continuar leve. */
export const MAX_FAVORITES = 60;

const PRODUCT_ID_PATTERN = /^[a-z0-9]{10,40}$/;

/** "id1.id2.id3" → ids válidos, sem repetição e dentro do limite. Lixo vira lista vazia. */
export function parseFavoritesCookie(value: string | undefined): string[] {
  if (!value) return [];
  const ids = value.split(".").filter((id) => PRODUCT_ID_PATTERN.test(id));
  return [...new Set(ids)].slice(0, MAX_FAVORITES);
}

export function serializeFavoritesCookie(ids: string[]): string {
  return ids.slice(0, MAX_FAVORITES).join(".");
}

/** Liga ou desliga um favorito, deixando o mais recente na frente. */
export function toggleFavoriteId(ids: string[], productId: string, favorite: boolean): string[] {
  const rest = ids.filter((id) => id !== productId);
  return (favorite ? [productId, ...rest] : rest).slice(0, MAX_FAVORITES);
}
