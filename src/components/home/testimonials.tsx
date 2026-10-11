import type { CSSProperties } from "react";
import Link from "next/link";
import { StarRating } from "@/components/catalog/star-rating";
import { SectionHeader } from "@/components/shared/section-header";
import { getFeaturedReviews } from "@/services/review-service";

const TESTIMONIALS_LIMIT = 3;

/** Depoimentos reais (avaliações de quem comprou). Some enquanto não houver nenhum bom o bastante. */
export async function Testimonials() {
  const reviews = await getFeaturedReviews(TESTIMONIALS_LIMIT);
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="depoimentos-titulo" className="mx-auto max-w-5xl space-y-8 px-4 pt-16 sm:pt-20">
      <SectionHeader
        id="depoimentos-titulo"
        className="reveal"
        image={{ src: "/branding/16_tag_aprovado_pela_chefe.png", width: 120, height: 100 }}
        kicker="de quem já provou"
        title="Quem provou, aprovou"
      />

      <ul className="grid gap-4 sm:grid-cols-3">
        {reviews.map((review, index) => (
          <li key={review.id} className="reveal" style={{ "--reveal-step": index } as CSSProperties}>
            <figure className="flex h-full flex-col gap-3 rounded-2xl surface p-5">
              <StarRating value={review.rating} />
              <span className="sr-only">Nota {review.rating} de 5.</span>
              <blockquote className="flex-1 text-sm text-foreground">“{review.comment}”</blockquote>
              <figcaption className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{review.authorFirstName}</span> sobre{" "}
                <Link href={`/cardapio/${review.product.slug}`} className="text-link hover:underline">
                  {review.product.name}
                </Link>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
