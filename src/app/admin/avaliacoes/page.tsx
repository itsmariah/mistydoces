import Link from "next/link";
import { Star } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { adminListReviews } from "@/services/review-service";
import { ReviewList } from "@/components/admin/review-list";
import { cn } from "@/lib/utils";

const RATINGS = [5, 4, 3, 2, 1] as const;

const VISIBILITY_FILTERS = { visiveis: true, ocultas: false } as const;
type VisibilityFilter = keyof typeof VISIBILITY_FILTERS;

type ReviewsQuery = { nota?: number; visibilidade?: VisibilityFilter };

function reviewsHref({ nota, visibilidade }: ReviewsQuery) {
  const params = new URLSearchParams();
  if (nota) params.set("nota", String(nota));
  if (visibilidade) params.set("visibilidade", visibilidade);
  const query = params.toString();
  return query ? `/admin/avaliacoes?${query}` : "/admin/avaliacoes";
}

const chipClass = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
    active ? "border-link bg-primary/10 text-link" : "border-border hover:bg-muted",
  );

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ nota?: string; visibilidade?: string }>;
}) {
  const user = await requirePagePermission("reviews:view");
  const params = await searchParams;
  const nota = RATINGS.find((r) => String(r) === params.nota);
  // hasOwn, não `in`: `?visibilidade=toString` não pode passar por um filtro válido.
  const visibilidade =
    params.visibilidade && Object.hasOwn(VISIBILITY_FILTERS, params.visibilidade)
      ? (params.visibilidade as VisibilityFilter)
      : undefined;

  const { reviews, ratingCounts, visibleCount, hiddenCount } = await adminListReviews({
    rating: nota,
    isVisible: visibilidade ? VISIBILITY_FILTERS[visibilidade] : undefined,
  });
  const ratingTotal = RATINGS.reduce((sum, rating) => sum + (ratingCounts[rating] ?? 0), 0);
  const hasFilters = Boolean(nota || visibilidade);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Avaliações</h1>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" aria-label="Filtrar por nota">
          <Link href={reviewsHref({ visibilidade })} className={chipClass(!nota)}>
            Todas as notas <span className="text-xs text-muted-foreground">{ratingTotal}</span>
          </Link>
          {RATINGS.map((rating) => (
            <Link
              key={rating}
              href={reviewsHref({ nota: rating, visibilidade })}
              className={chipClass(nota === rating)}
              aria-label={`${rating} estrela(s)`}
            >
              {rating}
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{ratingCounts[rating] ?? 0}</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Filtrar por visibilidade">
          <Link href={reviewsHref({ nota })} className={chipClass(!visibilidade)}>
            Todas <span className="text-xs text-muted-foreground">{visibleCount + hiddenCount}</span>
          </Link>
          <Link
            href={reviewsHref({ nota, visibilidade: "visiveis" })}
            className={chipClass(visibilidade === "visiveis")}
          >
            Visíveis no site <span className="text-xs text-muted-foreground">{visibleCount}</span>
          </Link>
          <Link
            href={reviewsHref({ nota, visibilidade: "ocultas" })}
            className={chipClass(visibilidade === "ocultas")}
          >
            Ocultas <span className="text-xs text-muted-foreground">{hiddenCount}</span>
          </Link>
        </div>
      </div>

      {hasFilters && (
        <p className="text-sm text-muted-foreground">
          {reviews.length} avaliação(ões) ·{" "}
          <Link href="/admin/avaliacoes" className="text-link hover:underline">
            Limpar filtros
          </Link>
        </p>
      )}

      <ReviewList
        reviews={reviews}
        canModerate={can(user.role, "reviews:moderate")}
        isFiltered={hasFilters}
      />
    </div>
  );
}
