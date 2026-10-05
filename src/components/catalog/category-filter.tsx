import Link from "next/link";
import { Check } from "lucide-react";
import type { Category } from "@/generated/prisma/client";
import { FREE_FROM_FILTERS, type FreeFromSlug } from "@/lib/allergens";
import { cardapioHref, type CatalogSort } from "@/lib/catalog-sort";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Category[];
  activeSlug?: string;
  sort: CatalogSort;
  search?: string;
  freeFrom: FreeFromSlug[];
};

const CHIP_CLASS =
  "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";

export function CategoryFilter({
  categories,
  activeSlug,
  sort,
  search,
  freeFrom,
}: CategoryFilterProps) {
  const chips = [
    { slug: undefined, name: "Todos" },
    ...categories.map((category) => ({ slug: category.slug, name: category.name })),
  ];

  return (
    // No celular vira uma faixa com rolagem lateral (sem barra visível); a partir de `sm`, quebra linha.
    <nav
      aria-label="Categorias"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const isActive = chip.slug === activeSlug;
        return (
          <Link
            key={chip.slug ?? "todos"}
            href={cardapioHref({ categoria: chip.slug, ordem: sort, busca: search, sem: freeFrom })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              CHIP_CLASS,
              isActive
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.name}
          </Link>
        );
      })}

      {/* Restrições ligam e desligam (e somam), ao contrário da categoria, que é uma só. */}
      <span aria-hidden="true" className="my-1 w-px shrink-0 bg-border" />
      {FREE_FROM_FILTERS.map((filter) => {
        const isOn = freeFrom.includes(filter.slug);
        const next = isOn ? freeFrom.filter((slug) => slug !== filter.slug) : [...freeFrom, filter.slug];
        return (
          <Link
            key={filter.slug}
            href={cardapioHref({ categoria: activeSlug, ordem: sort, busca: search, sem: next })}
            aria-current={isOn ? "true" : undefined}
            className={cn(
              CHIP_CLASS,
              isOn
                ? "border-secondary-foreground/40 bg-secondary text-secondary-foreground"
                : "border-dashed border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {isOn && <Check className="size-3.5" aria-hidden="true" />}
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
