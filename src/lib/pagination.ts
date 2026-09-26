export type PageItem = number | "ellipsis";

/**
 * Números exibidos na paginação: sempre a primeira e a última página, a atual e
 * suas vizinhas, com reticências nos buracos. Ex.: página 6 de 12 → 1 … 5 6 7 … 12.
 */
export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  // Perto das pontas, mostra um bloco de 5 para a largura não "pular" entre páginas.
  if (page <= 3) [2, 3, 4, 5].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [1, 2, 3, 4].forEach((d) => pages.add(totalPages - d));

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("ellipsis");
    items.push(p);
  });
  return items;
}

/** Lê `?pagina=` com segurança: qualquer coisa inválida vira a página 1. */
export function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
