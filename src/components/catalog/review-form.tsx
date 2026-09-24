"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setError(null);
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }

    startTransition(async () => {
      const result = await createReview(productSlug, productId, { rating, comment });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">Obrigado! Sua avaliação foi publicada.</p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Avalie este produto</p>

      <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= (hoverRating || rating);
          return (
            <button
              key={starValue}
              type="button"
              aria-label={`${starValue} estrela(s)`}
              onMouseEnter={() => setHoverRating(starValue)}
              onClick={() => setRating(starValue)}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  filled ? "fill-link text-link" : "fill-none text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment">Comentário (opcional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Conte como foi sua experiência com este produto."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" size="sm" disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </div>
  );
}
