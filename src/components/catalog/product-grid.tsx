import type { ReactNode } from "react";
import Image from "next/image";
import type { Category, Product, ProductVariant } from "@/generated/prisma/client";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { categoryIllustration } from "@/lib/category-illustrations";
import type { RatingSummary } from "@/lib/rating";
import { pluralize } from "@/lib/utils";

type GridProduct = Product & {
  category: Pick<Category, "name" | "slug">;
  variants: ProductVariant[];
};

type ProductGridProps = {
  products: GridProduct[];
  bestSellerIds?: Set<string>;
  ratings?: Map<string, RatingSummary>;
  /** Substitui o estado vazio padrão (ex.: busca sem resultado). */
  emptyState?: ReactNode;
  /**
   * Divide a grade em seções com o nome de cada categoria (na ordem alfabética delas),
   * mantendo a ordem dos produtos dentro de cada uma.
   */
  groupByCategory?: boolean;
};

const GRID_CLASS = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

/** Agrupa pelo slug da categoria, preservando a ordem recebida dentro de cada grupo. */
function groupProductsByCategory(products: GridProduct[]) {
  const groups = new Map<string, { category: GridProduct["category"]; products: GridProduct[] }>();
  for (const product of products) {
    const group = groups.get(product.category.slug);
    if (group) group.products.push(product);
    else groups.set(product.category.slug, { category: product.category, products: [product] });
  }
  return [...groups.values()].sort((a, b) =>
    a.category.name.localeCompare(b.category.name, "pt-BR"),
  );
}

export function ProductGrid({
  products,
  bestSellerIds,
  ratings,
  emptyState,
  groupByCategory = false,
}: ProductGridProps) {
  if (products.length === 0) {
    if (emptyState) return emptyState;
    return (
      <EmptyState
        image={{ src: "/branding/21_gatinha_de_costas.png", width: 110, height: 169 }}
        title="Nada por aqui ainda"
        description="Nenhum produto encontrado nessa categoria por enquanto. A chef Misty está preparando novidades!"
        className="py-16"
      />
    );
  }

  const renderCard = (product: GridProduct, index: number) => (
    <ProductCard
      key={product.id}
      index={index}
      product={product}
      isBestSeller={bestSellerIds?.has(product.id)}
      rating={ratings?.get(product.id)}
    />
  );

  if (!groupByCategory) {
    return <div className={GRID_CLASS}>{products.map(renderCard)}</div>;
  }

  // A cascata de entrada continua de uma seção para a outra, como se fosse uma grade só.
  let cardIndex = 0;
  return (
    <div className="space-y-12">
      {groupProductsByCategory(products).map(({ category, products: groupProducts }) => (
        <section
          key={category.slug}
          aria-labelledby={`secao-${category.slug}`}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary dark:bg-primary/20">
              <Image
                src={categoryIllustration(category.slug)}
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain"
              />
            </span>
            <h2 id={`secao-${category.slug}`} className="font-heading text-xl font-semibold">
              {category.name}
            </h2>
            <span className="text-sm text-muted-foreground">
              {pluralize(groupProducts.length, "doce", "doces")}
            </span>
          </div>
          <div className={GRID_CLASS}>
            {groupProducts.map((product) => renderCard(product, cardIndex++))}
          </div>
        </section>
      ))}
    </div>
  );
}
