"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { adminListReviews } from "@/services/review-service";
import { deleteReview, setReviewVisibility } from "@/actions/admin-reviews";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StarRating } from "@/components/catalog/star-rating";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Review = Awaited<ReturnType<typeof adminListReviews>>[number];

export function ReviewList({
  reviews,
  canModerate,
}: {
  reviews: Review[];
  canModerate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleVisibility(reviewId: string, isVisible: boolean) {
    startTransition(async () => {
      const result = await setReviewVisibility(reviewId, isVisible);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(isVisible ? "Avaliação reexibida no site." : "Avaliação ocultada do site.");
      router.refresh();
    });
  }

  async function handleDelete(reviewId: string) {
    const result = await deleteReview(reviewId);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Avaliação excluída.");
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        image={{ src: "/branding/16_tag_aprovado_pela_chefe.png", width: 132, height: 110 }}
        title="Nenhuma avaliação ainda"
        description="Quando clientes avaliarem os doces que receberam, as avaliações aparecem aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <StarRating value={review.rating} />
            <span className="text-sm font-medium">{review.product.name}</span>
            {!review.isVisible && <Badge variant="outline">Oculta</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Por {review.user.name}</p>
          {review.comment && <p className="text-sm">{review.comment}</p>}

          {canModerate && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleVisibility(review.id, !review.isVisible)}
              >
                {review.isVisible ? "Ocultar" : "Reexibir"}
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Excluir
                  </Button>
                }
                title={`Excluir a avaliação de ${review.user.name}?`}
                description="A avaliação some do site e do painel permanentemente. Para só tirá-la do site, use Ocultar."
                confirmLabel="Excluir"
                destructive
                onConfirm={() => handleDelete(review.id)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
