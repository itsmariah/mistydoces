/**
 * Alérgenos que a loja informa por produto. Espelha o enum `Allergen` do Prisma — fica
 * aqui (e não importado do client gerado) porque o formulário e os filtros rodam no navegador.
 */
export const ALLERGENS = [
  "GLUTEN",
  "LACTOSE",
  "EGGS",
  "PEANUTS",
  "TREE_NUTS",
  "SOY",
  "COCONUT",
  "ARTIFICIAL_COLORS",
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  GLUTEN: "Glúten",
  LACTOSE: "Leite/lactose",
  EGGS: "Ovos",
  PEANUTS: "Amendoim",
  TREE_NUTS: "Castanhas e nozes",
  SOY: "Soja",
  COCONUT: "Coco",
  ARTIFICIAL_COLORS: "Corantes",
};

/** Filtros "Sem …" do cardápio: slug da URL → alérgeno que o produto não pode ter. */
export const FREE_FROM_FILTERS = [
  { slug: "gluten", allergen: "GLUTEN", label: "Sem glúten" },
  { slug: "lactose", allergen: "LACTOSE", label: "Sem lactose" },
  { slug: "ovos", allergen: "EGGS", label: "Sem ovos" },
] as const satisfies readonly { slug: string; allergen: Allergen; label: string }[];

export type FreeFromSlug = (typeof FREE_FROM_FILTERS)[number]["slug"];

/** `?sem=gluten,ovos` → ["gluten", "ovos"], ignorando o que não for filtro conhecido. */
export function parseFreeFrom(value: string | undefined): FreeFromSlug[] {
  if (!value) return [];
  const requested = new Set(value.split(","));
  return FREE_FROM_FILTERS.filter((filter) => requested.has(filter.slug)).map((filter) => filter.slug);
}

/** Ingredientes preenchidos = a loja revisou os alérgenos desse produto. */
export function hasAllergenInfo(product: { ingredients: string | null }): boolean {
  return Boolean(product.ingredients?.trim());
}

/**
 * Produtos que atendem a todos os filtros "Sem …". Quem não tem ingredientes informados
 * fica de fora: sem informação não dá para garantir que não contém — e um filtro de
 * alergia que erra para o lado de mostrar é pior que um que mostra menos.
 */
export function filterFreeFrom<T extends { ingredients: string | null; allergens: readonly string[] }>(
  products: T[],
  slugs: FreeFromSlug[],
): T[] {
  if (slugs.length === 0) return products;
  const excluded = FREE_FROM_FILTERS.filter((filter) => slugs.includes(filter.slug)).map(
    (filter) => filter.allergen as string,
  );
  return products.filter(
    (product) =>
      hasAllergenInfo(product) && !product.allergens.some((allergen) => excluded.includes(allergen)),
  );
}

/** Na ordem da lista oficial, não na ordem em que foram marcados. */
export function sortAllergens(allergens: readonly string[]): Allergen[] {
  return ALLERGENS.filter((allergen) => allergens.includes(allergen));
}
