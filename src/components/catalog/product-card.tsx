import Image from "next/image";
import Link from "next/link";
import type { Category, Product, ProductVariant } from "@/generated/prisma/client";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { QuickAddButton } from "@/components/catalog/quick-add-button";
import { formatRating, type RatingSummary } from "@/lib/rating";
import { formatCurrency, getStartingPrice } from "@/lib/utils";

type ProductCardProps = {
  product: Product & {
    category: Pick<Category, "name">;
    variants: ProductVariant[];
  };
  isBestSeller?: boolean;
  /** Média das avaliações visíveis; sem avaliações, o card não mostra estrelas. */
  rating?: RatingSummary;
  /** Posição na grade — define o atraso da animação de entrada em cascata. */
  index?: number;
};

// Acima disso os cards já estão fora da tela inicial; atrasar mais só faria a página parecer lenta.
const MAX_STAGGERED_CARDS = 12;
const STAGGER_STEP_MS = 60;

export function ProductCard({ product, isBestSeller = false, rating, index = 0 }: ProductCardProps) {
  const startingPrice = getStartingPrice(product.variants);
  const priceLabel =
    product.variants.length > 1
      ? `A partir de ${formatCurrency(startingPrice)}`
      : formatCurrency(startingPrice);
  // O "+" só aparece quando não há escolha a fazer: uma única opção, e à venda.
  const quickAddVariant =
    product.isAvailable && product.variants.length === 1 ? product.variants[0] : null;

  // O card é um <article>, não um link: o "+" é um botão, e botão dentro de link não é HTML válido.
  // O link do título se estica (`after:inset-0`) e deixa o card inteiro clicável.
  return (
    <article
      data-enter-animation
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card animate-in fade-in slide-in-from-bottom-4 fill-mode-both animation-duration-500 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary-foreground/15 has-[a:focus-visible]:-translate-y-1 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
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
          <Link
            href={`/cardapio/${product.slug}`}
            className="outline-none after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>
        {rating && rating.count > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-link text-link" aria-hidden="true" />
            <span className="font-medium text-foreground">{formatRating(rating.average)}</span>
            <span aria-hidden="true">({rating.count})</span>
            <span className="sr-only">
              de 5, {rating.count} {rating.count === 1 ? "avaliação" : "avaliações"}
            </span>
          </p>
        )}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-semibold text-link">{priceLabel}</span>
          {quickAddVariant && (
            <QuickAddButton
              variantId={quickAddVariant.id}
              variantLabel={quickAddVariant.label}
              price={Number(quickAddVariant.price)}
              productSlug={product.slug}
              productName={product.name}
              imageUrl={product.imageUrl}
            />
          )}
        </div>
      </div>
    </article>
  );
}
