import type { Metadata } from "next";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { ProductGrid } from "@/components/catalog/product-grid";
import Link from "next/link";
import { SortSelect } from "@/components/catalog/sort-select";
import { SearchInput } from "@/components/catalog/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { filterProductsBySearch } from "@/lib/catalog-search";
import { FREE_FROM_FILTERS, filterFreeFrom, parseFreeFrom } from "@/lib/allergens";
import { getCategories, getProducts } from "@/lib/catalog";
import { cardapioHref, parseCatalogSort, sortProducts } from "@/lib/catalog-sort";
import {
  getUnitsSoldByProduct,
  rankBestSellersFromUnits,
} from "@/services/best-seller-service";
import { getRatingSummaries } from "@/services/review-service";

export const metadata: Metadata = {
  title: "Cardápio",
  description: "Bolos, brigadeiros, cookies e kits feitos na hora.",
};

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; ordem?: string; busca?: string; sem?: string }>;
}) {
  const { categoria, ordem, busca = "", sem } = await searchParams;
  const sort = parseCatalogSort(ordem);
  const freeFrom = parseFreeFrom(sem);
  const [categories, products, unitsSold, ratings] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categoria }),
    getUnitsSoldByProduct(),
    getRatingSummaries(),
  ]);
  const bestSellerIds = rankBestSellersFromUnits(unitsSold);
  const visibleProducts = sortProducts(
    filterFreeFrom(filterProductsBySearch(products, busca), freeFrom),
    sort,
    unitsSold,
  );
  const freeFromLabels = FREE_FROM_FILTERS.filter((filter) => freeFrom.includes(filter.slug)).map(
    (filter) => filter.label.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="font-display text-2xl text-link">feito na hora, com carinho</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Cardápio
        </h1>
        <p className="text-muted-foreground">
          Escolha entre bolos, brigadeiros, cookies e kits feitos na hora.
        </p>
        <div className="flex justify-center pt-4">
          <SearchInput query={busca} categoria={categoria} ordem={sort} freeFrom={freeFrom} />
        </div>
      </div>

      {/* Fica logo abaixo do header fixo (h-16) enquanto a grade rola. */}
      <div className="sticky top-16 z-30 -mx-4 flex items-center gap-3 bg-background/85 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="min-w-0 flex-1">
          <CategoryFilter
            categories={categories}
            activeSlug={categoria}
            sort={sort}
            search={busca}
            freeFrom={freeFrom}
          />
        </div>
        <SortSelect
          sort={sort}
          activeCategorySlug={categoria}
          search={busca}
          freeFrom={freeFrom}
        />
      </div>

      {freeFrom.length > 0 && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Mostrando só doces com ingredientes informados pela loja. Na dúvida, fale com a gente
          antes de pedir.
        </p>
      )}

      {busca && visibleProducts.length > 0 && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {visibleProducts.length}{" "}
          {visibleProducts.length === 1 ? "resultado" : "resultados"} para “{busca}”
        </p>
      )}

      <ProductGrid
        products={visibleProducts}
        bestSellerIds={bestSellerIds}
        ratings={ratings}
        emptyState={
          freeFrom.length > 0 && !busca ? (
            <EmptyState
              image={{ src: "/branding/21_gatinha_de_costas.png", width: 110, height: 169 }}
              title="Nenhum doce encontrado"
              description={`Ainda não temos doces ${freeFromLabels.join(" e ")}${categoria ? " nesta categoria" : ""} com ingredientes informados.`}
              action={
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={cardapioHref({ categoria, ordem: sort })} />}
                >
                  Limpar filtros
                </Button>
              }
              className="py-16"
            />
          ) : busca ? (
            <EmptyState
              image={{ src: "/branding/21_gatinha_de_costas.png", width: 110, height: 169 }}
              title="Nenhum doce encontrado"
              description={`Não achamos nada para “${busca}”${categoria ? " nesta categoria" : ""}. Tente outra palavra.`}
              action={
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={cardapioHref({ categoria, ordem: sort, sem: freeFrom })} />}
                >
                  Limpar busca
                </Button>
              }
              className="py-16"
            />
          ) : undefined
        }
      />

      <RecentlyViewed className="mt-4" />
    </div>
  );
}
