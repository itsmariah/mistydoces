export type AdminProductsQuery = { busca?: string; categoria?: string; status?: string };

/** URL da lista de produtos do painel mantendo busca, categoria e status juntos. */
export function adminProductsHref({ busca, categoria, status }: AdminProductsQuery) {
  const params = new URLSearchParams();
  if (busca) params.set("busca", busca);
  if (categoria) params.set("categoria", categoria);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/admin/produtos?${query}` : "/admin/produtos";
}
