import { getStartingPrice } from "@/lib/utils";

/** Valores aceitos no `?ordem=` do cardápio — em português, porque aparecem na URL. */
export const CATALOG_SORTS = {
  nome: "Nome (A–Z)",
  "mais-vendidos": "Mais vendidos",
  "menor-preco": "Menor preço",
  novidades: "Novidades",
} as const;

export type CatalogSort = keyof typeof CATALOG_SORTS;

export const DEFAULT_CATALOG_SORT: CatalogSort = "nome";

/** Converte o parâmetro da URL, caindo no padrão para qualquer valor desconhecido. */
export function parseCatalogSort(value: string | undefined): CatalogSort {
  // `Object.hasOwn`, não `in`: `?ordem=toString` não pode passar por herança do protótipo.
  return value && Object.hasOwn(CATALOG_SORTS, value) ? (value as CatalogSort) : DEFAULT_CATALOG_SORT;
}

/** URL do cardápio para uma categoria + ordenação — omite o que for padrão, para a URL ficar limpa. */
export function cardapioHref(categorySlug: string | undefined, sort: CatalogSort) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("categoria", categorySlug);
  if (sort !== DEFAULT_CATALOG_SORT) params.set("ordem", sort);
  const query = params.toString();
  return query ? `/cardapio?${query}` : "/cardapio";
}

type SortableProduct = {
  id: string;
  name: string;
  createdAt: Date;
  variants: Array<{ price: number | string | { toString(): string } }>;
};

/**
 * Ordena em memória — o cardápio de uma confeitaria tem poucas dezenas de produtos,
 * e "menor preço" depende da variante mais barata, o que o banco não ordena direto.
 * Empates sempre caem na ordem alfabética, para a lista não "embaralhar" entre visitas.
 */
export function sortProducts<T extends SortableProduct>(
  products: T[],
  sort: CatalogSort,
  unitsSoldByProduct: Map<string, number>,
): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "pt-BR");

  const compare: Record<CatalogSort, (a: T, b: T) => number> = {
    nome: byName,
    "mais-vendidos": (a, b) =>
      (unitsSoldByProduct.get(b.id) ?? 0) - (unitsSoldByProduct.get(a.id) ?? 0) || byName(a, b),
    "menor-preco": (a, b) =>
      getStartingPrice(a.variants) - getStartingPrice(b.variants) || byName(a, b),
    novidades: (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || byName(a, b),
  };

  return [...products].sort(compare[sort]);
}
