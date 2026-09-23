import Image from "next/image";
import Link from "next/link";
import type { Category, Product, ProductVariant } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { formatCurrency, getStartingPrice } from "@/lib/utils";

type ProductCardProps = {
  product: Product & {
    category: Pick<Category, "name">;
    variants: ProductVariant[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const startingPrice = getStartingPrice(product.variants);
  const priceLabel =
    product.variants.length > 1
      ? `A partir de ${formatCurrency(startingPrice)}`
      : formatCurrency(startingPrice);

  return (
    <Link
      href={`/cardapio/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <ProductPlaceholderImage />
        )}
        {!product.isAvailable && (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 bg-background/90"
          >
            Esgotado
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium text-muted-foreground">
          {product.category.name}
        </span>
        <h3 className="font-heading text-base font-semibold">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <span className="mt-auto pt-2 text-lg font-semibold text-primary">
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}
