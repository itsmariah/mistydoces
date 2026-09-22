"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { adminListReviews } from "@/services/review-service";
import { deleteReview, setReviewVisibility } from "@/actions/admin-reviews";
import { StarRating } from "@/components/catalog/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Review = Awaited<ReturnType<typeof adminListReviews>>[number];

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleToggleVisibility(reviewId: string, isVisible: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setReviewVisibility(reviewId, isVisible);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(reviewId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if (!result.success) {
        setError(result.error.message);
        setConfirmingDeleteId(null);
        return;
      }
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {reviews.map((review) => (
        <div key={review.id} className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} />
              <span className="text-sm font-medium">{review.product.name}</span>
              {!review.isVisible && <Badge variant="outline">Oculta</Badge>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Por {review.user.name}</p>
          {review.comment && <p className="text-sm">{review.comment}</p>}

          {confirmingDeleteId === review.id ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">Excluir permanentemente?</span>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => handleDelete(review.id)}
              >
                Sim
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmingDeleteId(null)}
              >
                Voltar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleVisibility(review.id, !review.isVisible)}
              >
                {review.isVisible ? "Ocultar" : "Reexibir"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmingDeleteId(review.id)}
              >
                Excluir
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
