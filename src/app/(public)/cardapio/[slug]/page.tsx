import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { StarRating } from "@/components/catalog/star-rating";
import { ReviewForm } from "@/components/catalog/review-form";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { EmptyState } from "@/components/shared/empty-state";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog";
import { BASE_OPEN_GRAPH } from "@/lib/site-metadata";
import { formatCurrency, getStartingPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import {
  getProductRatingSummary,
  getProductReviews,
  getReviewEligibility,
} from "@/services/review-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  // O preço vai na frente da descrição: é o que aparece na prévia do link no WhatsApp.
  const startingPrice = formatCurrency(getStartingPrice(product.variants));
  const priceLabel = product.variants.length > 1 ? `A partir de ${startingPrice}` : startingPrice;
  const description = `${priceLabel} · ${product.description}`;
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
  const [ratingSummary, reviews, eligibility] = await Promise.all([
    getProductRatingSummary(product.id),
    getProductReviews(product.id),
    session?.user
      ? getReviewEligibility(session.user.id, product.id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <Link
        href="/cardapio"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao cardápio
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
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

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {product.category.name}
            </span>
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              {product.name}
            </h1>
            {ratingSummary.count > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={ratingSummary.average} />
                <span className="text-sm text-muted-foreground">
                  {ratingSummary.average.toFixed(1)} ({ratingSummary.count}{" "}
                  {ratingSummary.count === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
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
        </div>
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="font-heading text-lg font-medium">Avaliações</h2>

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
    </div>
  );
}
