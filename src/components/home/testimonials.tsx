import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/catalog/star-rating";
import { getFeaturedReviews } from "@/services/review-service";

const TESTIMONIALS_LIMIT = 3;

/** Depoimentos reais (avaliações de quem comprou). Some enquanto não houver nenhum bom o bastante. */
export async function Testimonials() {
  const reviews = await getFeaturedReviews(TESTIMONIALS_LIMIT);
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="depoimentos-titulo" className="mx-auto max-w-5xl space-y-8 px-4 py-16 sm:py-20">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/branding/16_tag_aprovado_pela_chefe.png" alt="" width={120} height={100} />
        <h2 id="depoimentos-titulo" className="font-heading text-2xl font-semibold">
          Quem provou, aprovou
        </h2>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <figure className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5">
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
