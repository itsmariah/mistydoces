import type { Category, Product, ProductVariant } from "@/generated/prisma/client";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/shared/empty-state";

type ProductGridProps = {
  products: Array<
    Product & { category: Pick<Category, "name">; variants: ProductVariant[] }
  >;
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        image={{ src: "/branding/21_gatinha_de_costas.png", width: 110, height: 169 }}
        title="Nada por aqui ainda"
        description="Nenhum produto encontrado nessa categoria por enquanto. A chef Misty está preparando novidades!"
        className="py-16"
      />
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
