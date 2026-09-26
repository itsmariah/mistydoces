import Link from "next/link";
import { STORE_TIME_ZONE, type DashboardData } from "@/services/dashboard-service";
import { StarRating } from "@/components/catalog/star-rating";
import { Badge } from "@/components/ui/badge";

/** Nota a partir da qual a avaliação merece atenção (responder ou ocultar). */
const LOW_RATING = 3;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

export function RecentReviews({ reviews }: { reviews: DashboardData["recentReviews"] }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Últimas avaliações</h2>
        <Link href="/admin/avaliacoes" className="text-sm font-medium text-link hover:underline">
          Ver todas
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
      ) : (
        <ul className="divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="space-y-1 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <StarRating value={review.rating} />
                <span className="sr-only">{review.rating} de 5 estrelas</span>
                <span className="text-sm font-medium">{review.product.name}</span>
                {review.rating <= LOW_RATING && <Badge variant="destructive">Nota baixa</Badge>}
                {!review.isVisible && <Badge variant="outline">Oculta</Badge>}
              </div>
              {review.comment && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {review.user.name} · {dateFormatter.format(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
