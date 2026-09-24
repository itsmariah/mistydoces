import Link from "next/link";
import type { Category } from "@/generated/prisma/client";
import { cardapioHref, type CatalogSort } from "@/lib/catalog-sort";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Category[];
  activeSlug?: string;
  sort: CatalogSort;
  search?: string;
};

export function CategoryFilter({ categories, activeSlug, sort, search }: CategoryFilterProps) {
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
            href={cardapioHref({ categoria: chip.slug, ordem: sort, busca: search })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.name}
          </Link>
        );
      })}
    </nav>
  );
}
