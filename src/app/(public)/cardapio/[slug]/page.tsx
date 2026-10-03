import { ViewTransition } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { StarRating } from "@/components/catalog/star-rating";
import { ReviewForm } from "@/components/catalog/review-form";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { BackToCardapioLink } from "@/components/catalog/back-to-cardapio-link";
import { ProductCard } from "@/components/catalog/product-card";
import { RatingBreakdown } from "@/components/catalog/rating-breakdown";
import { ShareButton } from "@/components/catalog/share-button";
import { EmptyState } from "@/components/shared/empty-state";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatRating } from "@/lib/rating";
import { productImageTransitionName } from "@/lib/view-transitions";
import { BASE_OPEN_GRAPH } from "@/lib/site-metadata";
import { formatCurrency, getStartingPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getBestSellerProductIds } from "@/services/best-seller-service";
import {
  getProductRatingSummary,
  getProductReviews,
  getRatingSummaries,
  getReviewEligibility,
} from "@/services/review-service";

const RELATED_PRODUCTS_LIMIT = 4;

function getPriceLabel(variants: { price: { toString(): string } }[]) {
  const startingPrice = formatCurrency(getStartingPrice(variants));
  return variants.length > 1 ? `A partir de ${startingPrice}` : startingPrice;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  // O preço vai na frente da descrição: é o que aparece na prévia do link no WhatsApp.
  const description = `${getPriceLabel(product.variants)} · ${product.description}`;
  const image = product.imageUrl
    ? { url: product.imageUrl, alt: product.name }
    : { url: "/branding/17_gatinha_chefe_de_pe.png", alt: product.name };

  return {
    title: product.name,
    description,
    openGraph: {
      ...BASE_OPEN_GRAPH,
      title: product.name,
      description,
      url: `/cardapio/${product.slug}`,
      images: [image],
    },
  };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const [ratingSummary, reviews, eligibility, bestSellerIds, related] = await Promise.all([
    getProductRatingSummary(product.id),
    getProductReviews(product.id),
    session?.user
      ? getReviewEligibility(session.user.id, product.id)
      : Promise.resolve(null),
    getBestSellerProductIds(),
    getRelatedProducts(product, RELATED_PRODUCTS_LIMIT),
  ]);
  const relatedRatings = await getRatingSummaries(related.map((item) => item.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <BackToCardapioLink />

      <div className="grid gap-8 sm:grid-cols-2">
        <ViewTransition
          name={productImageTransitionName(product.slug)}
          share="product-image"
          default="none"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            ) : (
              <ProductPlaceholderImage className="object-contain p-10" />
            )}
          </div>
        </ViewTransition>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {product.category.name}
              </span>
              {bestSellerIds.has(product.id) && (
                <Badge variant="secondary" className="gap-1 pl-1.5">
                  <Image src="/branding/10_coracao_patinha.png" alt="" width={16} height={16} />
                  Mais vendido
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              {product.name}
            </h1>
            {ratingSummary.count > 0 && (
              <a href="#avaliacoes" className="flex w-fit items-center gap-2 hover:underline">
                <StarRating value={ratingSummary.average} />
                <span className="text-sm text-muted-foreground">
                  {formatRating(ratingSummary.average)} ({ratingSummary.count}{" "}
                  {ratingSummary.count === 1 ? "avaliação" : "avaliações"})
                </span>
              </a>
            )}
          </div>

          {!product.isAvailable && (
            <Badge variant="secondary" className="w-fit">
              Esgotado no momento
            </Badge>
          )}

          <p className="text-muted-foreground">{product.description}</p>

          <VariantSelector
            productSlug={product.slug}
            productName={product.name}
            imageUrl={product.imageUrl}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              label: variant.label,
              price: Number(variant.price),
            }))}
            disabled={!product.isAvailable}
          />

          <div>
            <ShareButton
              title={product.name}
              text={`${product.name} · ${getPriceLabel(product.variants)} na MistyDoces`}
            />
          </div>
        </div>
      </div>

      <section id="avaliacoes" className="scroll-mt-20 space-y-4 border-t border-border pt-8">
        <h2 className="font-heading text-lg font-medium">Avaliações</h2>

        {ratingSummary.count > 0 && <RatingBreakdown summary={ratingSummary} />}

        {eligibility?.canReview && (
          <ReviewForm productId={product.id} productSlug={product.slug} />
        )}
        {eligibility?.alreadyReviewed && (
          <p className="text-sm text-muted-foreground">Você já avaliou este produto. Obrigado!</p>
        )}

        {reviews.length === 0 ? (
          <EmptyState
            image={{ src: "/branding/16_tag_aprovado_pela_chefe.png", width: 120, height: 100 }}
            title="Ainda sem avaliações"
            description="Já provou? Depois que seu pedido for entregue, conta pra gente o que achou."
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-1 border-b border-border pb-4 last:border-0">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} />
                  <span className="text-sm font-medium">{review.user.name}</span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="relacionados-titulo" className="space-y-4 border-t border-border pt-8">
          <h2 id="relacionados-titulo" className="font-heading text-lg font-medium">
            Você também vai gostar
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                index={index}
                isBestSeller={bestSellerIds.has(item.id)}
                rating={relatedRatings.get(item.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
