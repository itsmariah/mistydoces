"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { CATALOG_SORTS, cardapioHref, type CatalogSort } from "@/lib/catalog-sort";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortSelectProps = {
  sort: CatalogSort;
  activeCategorySlug?: string;
  search?: string;
};

export function SortSelect({ sort, activeCategorySlug, search }: SortSelectProps) {
  const router = useRouter();

  function handleChange(next: CatalogSort | null) {
    if (!next || next === sort) return;
    router.push(cardapioHref({ categoria: activeCategorySlug, ordem: next, busca: search }), {
      scroll: false,
    });
  }

  return (
    <Select items={CATALOG_SORTS} value={sort} onValueChange={handleChange}>
      <SelectTrigger aria-label="Ordenar produtos" className="shrink-0 bg-background">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        {/* No celular só o ícone, para sobrar espaço para as categorias. */}
        <span className="hidden sm:inline">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {(Object.keys(CATALOG_SORTS) as CatalogSort[]).map((key) => (
          <SelectItem key={key} value={key}>
            {CATALOG_SORTS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
