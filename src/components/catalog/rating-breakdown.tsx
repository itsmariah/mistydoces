import { Star } from "lucide-react";
import { StarRating } from "@/components/catalog/star-rating";
import { RATING_VALUES, formatRating, type RatingBreakdown as Breakdown } from "@/lib/rating";

/** Média em destaque + uma barra por nota, como nas lojas grandes. */
export function RatingBreakdown({ summary }: { summary: Breakdown }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-1 text-center">
        <span className="font-heading text-4xl font-semibold">
          {formatRating(summary.average)}
          <span className="sr-only"> de 5 estrelas</span>
        </span>
        <StarRating value={summary.average} />
        <span className="text-xs text-muted-foreground">
          {summary.count} {summary.count === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>

      <ul className="flex-1 space-y-1.5" aria-label="Distribuição das notas">
        {RATING_VALUES.map((rating) => {
          const count = summary.distribution[rating];
          const percent = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
          return (
            <li key={rating} className="flex items-center gap-2 text-xs">
              <span
                className="flex w-6 shrink-0 items-center gap-0.5 text-muted-foreground"
                aria-hidden="true"
              >
                {rating}
                <Star className="size-3 fill-current" />
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-link" style={{ width: `${percent}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-muted-foreground" aria-hidden="true">
                {count}
              </span>
              <span className="sr-only">
                {rating} {rating === 1 ? "estrela" : "estrelas"}: {count}{" "}
                {count === 1 ? "avaliação" : "avaliações"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
