export { cn } from "cn";

export function formatCurrency(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function getStartingPrice(
  variants: Array<{ price: number | string | { toString(): string } }>,
): number {
  return Math.min(...variants.map((variant) => Number(variant.price.toString())));
}

/** "R$ 15,00", ou "A partir de R$ 4,00" quando o produto tem mais de uma opção. */
export function formatPriceLabel(
  variants: Array<{ price: number | string | { toString(): string } }>,
): string {
  const startingPrice = formatCurrency(getStartingPrice(variants));
  return variants.length > 1 ? `A partir de ${startingPrice}` : startingPrice;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** "1 pedido" / "3 pedidos" — no lugar de "pedido(s)". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
