import { describe, expect, it } from "vitest";
import { formatRating, summarizeRatings } from "@/lib/rating";

describe("summarizeRatings", () => {
  it("calcula média, total e distribuição a partir das contagens por nota", () => {
    const summary = summarizeRatings([
      { rating: 5, count: 3 },
      { rating: 4, count: 1 },
      { rating: 2, count: 1 },
    ]);

    expect(summary.count).toBe(5);
    expect(summary.average).toBeCloseTo((5 * 3 + 4 + 2) / 5);
    expect(summary.distribution).toEqual({ 5: 3, 4: 1, 3: 0, 2: 1, 1: 0 });
  });

  it("sem avaliações, média zero e distribuição vazia", () => {
    expect(summarizeRatings([])).toEqual({
      average: 0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
  });

  it("ignora notas fora de 1 a 5", () => {
    const summary = summarizeRatings([
      { rating: 5, count: 1 },
      { rating: 0, count: 4 },
    ]);
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(5);
  });
});

describe("formatRating", () => {
  it("usa vírgula e uma casa decimal", () => {
    expect(formatRating(4.666)).toBe("4,7");
    expect(formatRating(5)).toBe("5,0");
  });
});
