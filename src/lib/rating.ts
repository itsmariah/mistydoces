export const RATING_VALUES = [5, 4, 3, 2, 1] as const;

export type RatingValue = (typeof RATING_VALUES)[number];

export type RatingSummary = { average: number; count: number };

export type RatingBreakdown = RatingSummary & {
  /** Quantas avaliações cada nota recebeu (notas sem avaliação aparecem com 0). */
  distribution: Record<RatingValue, number>;
};

/** Monta média, total e distribuição a partir das contagens por nota. */
export function summarizeRatings(rows: { rating: number; count: number }[]): RatingBreakdown {
  const distribution: Record<RatingValue, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let count = 0;
  let sum = 0;

  for (const row of rows) {
    if (!RATING_VALUES.includes(row.rating as RatingValue)) continue;
    distribution[row.rating as RatingValue] += row.count;
    count += row.count;
    sum += row.rating * row.count;
  }

  return { average: count > 0 ? sum / count : 0, count, distribution };
}

/** `4.666…` → `"4,7"` — uma casa decimal, com vírgula. */
export function formatRating(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
