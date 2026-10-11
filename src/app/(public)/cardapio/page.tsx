import type { Metadata } from "next";
import { CategoryFilter, FreeFromFilter } from "@/components/catalog/category-filter";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { ProductGrid } from "@/components/catalog/product-grid";
import Link from "next/link";
import { SortSelect } from "@/components/catalog/sort-select";
import { SearchInput } from "@/components/catalog/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { filterProductsBySearch } from "@/lib/catalog-search";
import { FREE_FROM_FILTERS, filterFreeFrom, parseFreeFrom } from "@/lib/allergens";
import { getCategories, getProducts } from "@/lib/catalog";
import {
  cardapioHref,
  DEFAULT_CATALOG_SORT,
  parseCatalogSort,
  sortProducts,
} from "@/lib/catalog-sort";
import { pluralize } from "@/lib/utils";
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
  const activeCategory = categories.find((category) => category.slug === categoria);
  // Vendo tudo na ordem padrão, o cardápio fica em seções por categoria. Com busca ou outra
  // ordenação (ex.: menor preço), a pessoa quer a lista corrida, então a grade fica única.
  const groupByCategory = !categoria && !busca && sort === DEFAULT_CATALOG_SORT;
  const resultCount = busca
    ? `${pluralize(visibleProducts.length, "resultado", "resultados")} para “${busca}”`
    : `${pluralize(visibleProducts.length, "doce", "doces")}${activeCategory ? ` em ${activeCategory.name}` : ""}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <PageHeader
        kicker="feito na hora, com carinho"
        title="Cardápio"
        description="Escolha entre bolos, brigadeiros, cookies e kits feitos na hora."
      >
        <div className="flex w-full justify-center pt-2">
          <SearchInput query={busca} categoria={categoria} ordem={sort} freeFrom={freeFrom} />
        </div>
      </PageHeader>

      {/* Fica logo abaixo do header fixo (--header-h) enquanto a grade rola. Só as categorias grudam
          (ganham a largura toda, numa linha só); restrições e ordenação ficam na linha de baixo. */}
      <div className="sticky top-(--header-h) z-30 -mx-4 bg-background/85 transition-[top] duration-300 motion-reduce:transition-none px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70">
        <CategoryFilter
          categories={categories}
          activeSlug={categoria}
          sort={sort}
          search={busca}
          freeFrom={freeFrom}
        />
      </div>

      <div className="-mt-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {visibleProducts.length > 0 ? resultCount : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FreeFromFilter
              activeCategorySlug={categoria}
              sort={sort}
              search={busca}
              freeFrom={freeFrom}
            />
            <SortSelect
              sort={sort}
              activeCategorySlug={categoria}
              search={busca}
              freeFrom={freeFrom}
            />
          </div>
        </div>
        {freeFrom.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando só doces com ingredientes informados pela loja. Na dúvida, fale com a gente
            antes de pedir.
          </p>
        )}
      </div>

      {/* Os cards usam h3: sem as seções por categoria (que trazem seus próprios h2), este h2
          (só para leitor de tela) mantém a hierarquia h1 → h2 → h3. */}
      {!groupByCategory && <h2 className="sr-only">Produtos</h2>}
      <ProductGrid
        groupByCategory={groupByCategory}
        hideCategory={!!activeCategory}
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
