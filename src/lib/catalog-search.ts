/** Minúsculas e sem acentos — "Paçoca" e "pacoca" precisam encontrar o mesmo doce. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

type SearchableProduct = {
  name: string;
  description: string | null;
  category: { name: string };
};

/**
 * Filtra em memória (o cardápio é pequeno e já vem inteiro do banco), porque o
 * `mode: "insensitive"` do Prisma ignora maiúsculas mas não acentos.
 * Cada palavra da busca precisa aparecer no nome, na descrição ou na categoria.
 */
export function filterProductsBySearch<T extends SearchableProduct>(
  products: T[],
  query: string | undefined,
): T[] {
  const terms = normalizeSearchText(query ?? "").split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products;

  return products.filter((product) => {
    const haystack = normalizeSearchText(
      `${product.name} ${product.description ?? ""} ${product.category.name}`,
    );
    return terms.every((term) => haystack.includes(term));
  });
}
