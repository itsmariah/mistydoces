import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { getCategories, getProducts } from "@/lib/catalog";
import { parseCatalogSort, sortProducts } from "@/lib/catalog-sort";
import {
  getUnitsSoldByProduct,
  rankBestSellersFromUnits,
} from "@/services/best-seller-service";

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; ordem?: string }>;
}) {
  const { categoria, ordem } = await searchParams;
  const sort = parseCatalogSort(ordem);
  const [categories, products, unitsSold] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categoria }),
    getUnitsSoldByProduct(),
  ]);
  const bestSellerIds = rankBestSellersFromUnits(unitsSold);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Cardápio
        </h1>
        <p className="text-muted-foreground">
          Escolha entre bolos, brigadeiros, cookies e kits feitos na hora.
        </p>
      </div>

      {/* Fica logo abaixo do header fixo (h-16) enquanto a grade rola. */}
      <div className="sticky top-16 z-30 -mx-4 flex items-center gap-3 bg-background/85 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="min-w-0 flex-1">
          <CategoryFilter categories={categories} activeSlug={categoria} sort={sort} />
        </div>
        <SortSelect sort={sort} activeCategorySlug={categoria} />
      </div>

      <ProductGrid
        products={sortProducts(products, sort, unitsSold)}
        bestSellerIds={bestSellerIds}
      />
    </div>
  );
}
