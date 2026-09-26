"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setProductAvailability } from "@/actions/products";
import { Button } from "@/components/ui/button";

/** Marca esgotado/disponível direto da lista — tarefa do dia a dia, sem abrir o formulário. */
export function ProductAvailabilityToggle({
  productId,
  productName,
  isAvailable,
}: {
  productId: string;
  productName: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await setProductAvailability(productId, !isAvailable);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        isAvailable
          ? `"${productName}" marcado como esgotado.`
          : `"${productName}" disponível de novo.`,
      );
      router.refresh();
    });
  }

  return (
    <Button
      variant={isAvailable ? "outline" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={handleToggle}
      aria-label={
        isAvailable ? `Marcar ${productName} como esgotado` : `Marcar ${productName} como disponível`
      }
    >
      {isAvailable ? "Marcar esgotado" : "Marcar disponível"}
    </Button>
  );
}
