import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductGrid } from "@/components/catalog/product-grid";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categoria }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Cardápio
        </h1>
        <p className="text-muted-foreground">
          Escolha entre bolos, brigadeiros, cookies e kits feitos na hora.
        </p>
      </div>

      <CategoryFilter categories={categories} activeSlug={categoria} />

      <ProductGrid products={products} />
    </div>
  );
}
