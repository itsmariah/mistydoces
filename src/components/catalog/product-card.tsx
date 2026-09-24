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
  isBestSeller?: boolean;
  /** Posição na grade — define o atraso da animação de entrada em cascata. */
  index?: number;
};

// Acima disso os cards já estão fora da tela inicial; atrasar mais só faria a página parecer lenta.
const MAX_STAGGERED_CARDS = 12;
const STAGGER_STEP_MS = 60;

export function ProductCard({ product, isBestSeller = false, index = 0 }: ProductCardProps) {
  const startingPrice = getStartingPrice(product.variants);
  const priceLabel =
    product.variants.length > 1
      ? `A partir de ${formatCurrency(startingPrice)}`
      : formatCurrency(startingPrice);

  return (
    <Link
      href={`/cardapio/${product.slug}`}
      data-enter-animation
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card outline-none animate-in fade-in slide-in-from-bottom-4 fill-mode-both animation-duration-500 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary-foreground/15 focus-visible:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50"
      style={{ animationDelay: `${Math.min(index, MAX_STAGGERED_CARDS) * STAGGER_STEP_MS}ms` }}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <ProductPlaceholderImage />
        )}
        {isBestSeller && (
          <Badge variant="secondary" className="absolute left-2 top-2 gap-1 pl-1.5 shadow-sm">
            <Image
              src="/branding/10_coracao_patinha.png"
              alt=""
              width={16}
              height={16}
            />
            Mais vendido
          </Badge>
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
        <span className="mt-auto pt-2 text-lg font-semibold text-link">
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}
