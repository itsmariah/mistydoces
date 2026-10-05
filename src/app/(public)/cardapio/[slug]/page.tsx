import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarClock, Clock, CreditCard, Store, Truck } from "lucide-react";
import { formatLeadTimeLong } from "@/lib/scheduling";
import { Badge } from "@/components/ui/badge";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { StarRating } from "@/components/catalog/star-rating";
import { ReviewForm } from "@/components/catalog/review-form";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { BackToCardapioLink } from "@/components/catalog/back-to-cardapio-link";
import { ProductCard } from "@/components/catalog/product-card";
import { RatingBreakdown } from "@/components/catalog/rating-breakdown";
import { ShareButton } from "@/components/catalog/share-button";
import { RecentlyViewed } from "@/components/catalog/recently-viewed";
import { EmptyState } from "@/components/shared/empty-state";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatRating } from "@/lib/rating";
import { BASE_OPEN_GRAPH } from "@/lib/site-metadata";
import { formatCurrency, getStartingPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getBestSellerProductIds } from "@/services/best-seller-service";
import { getDeliveryFee, getStoreContact } from "@/services/store-settings-service";
import { OpenStatus } from "@/components/shared/open-status";
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
  const [ratingSummary, reviews, eligibility, bestSellerIds, related, deliveryFee, contact] =
    await Promise.all([
    getProductRatingSummary(product.id),
    getProductReviews(product.id),
    session?.user
      ? getReviewEligibility(session.user.id, product.id)
      : Promise.resolve(null),
    getBestSellerProductIds(),
    getRelatedProducts(product, RELATED_PRODUCTS_LIMIT),
    getDeliveryFee(),
    getStoreContact(),
  ]);
  const relatedRatings = await getRatingSummaries(related.map((item) => item.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <BackToCardapioLink />

      <div className="grid gap-8 sm:grid-cols-2">
        <ProductGallery
          images={[
            ...(product.imageUrl ? [product.imageUrl] : []),
            ...product.images.map((image) => image.url),
          ]}
          productName={product.name}
          productSlug={product.slug}
        />

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
            leadTimeDays={product.leadTimeDays}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              label: variant.label,
              price: Number(variant.price),
            }))}
            disabled={!product.isAvailable}
          />

          {/* Responde as dúvidas de entrega e pagamento antes do checkout. */}
          <ul className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            {product.leadTimeDays > 0 && (
              <li className="flex items-center gap-2 font-medium text-foreground">
                <CalendarClock className="size-4 shrink-0 text-link" aria-hidden="true" />
                {formatLeadTimeLong(product.leadTimeDays)}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-link" aria-hidden="true" />
              {deliveryFee > 0
                ? `Entrega em casa por ${formatCurrency(deliveryFee)}`
                : "Entrega em casa grátis"}
            </li>
            <li className="flex items-center gap-2">
              <Store className="size-4 shrink-0 text-link" aria-hidden="true" />
              Ou retire na loja sem custo
            </li>
            <li className="flex items-center gap-2">
              <CreditCard className="size-4 shrink-0 text-link" aria-hidden="true" />
              Pix, cartão ou dinheiro, online ou na entrega
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-link" aria-hidden="true" />
              <OpenStatus schedule={contact.schedule} />
            </li>
          </ul>

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

      <RecentlyViewed currentSlug={product.slug} />
    </div>
  );
}
