import type { Category, Product, ProductVariant } from "@/generated/prisma/client";
import { ProductCard } from "@/components/catalog/product-card";

type ProductGridProps = {
  products: Array<
    Product & { category: Pick<Category, "name">; variants: ProductVariant[] }
  >;
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Nenhum produto encontrado nessa categoria por enquanto.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
