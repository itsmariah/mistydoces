"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { refreshCart } from "@/actions/cart";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { planReorder, type ReorderLine } from "@/lib/cart";

/** `A` · `A e B` · `A, B e C` */
function joinNames(names: string[]): string {
  const unique = [...new Set(names)];
  return unique.length === 1 ? unique[0] : `${unique.slice(0, -1).join(", ")} e ${unique.at(-1)}`;
}

/**
 * Coloca os itens de um pedido antigo de volta no carrinho. Confere tudo no servidor antes:
 * entra o preço de hoje, e o que saiu do cardápio ou está esgotado fica de fora, com aviso.
 */
export function ReorderButton({
  lines,
  className,
}: {
  lines: ReorderLine[];
  className?: string;
}) {
  const { addItem, setOpen } = useCart();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await refreshCart(lines.map((line) => line.variantId)).catch(() => null);
      if (!result?.success) {
        toast.error("Não foi possível montar o pedido agora. Tente de novo em instantes.");
        return;
      }

      const { toAdd, skipped } = planReorder(lines, result.data);
      if (toAdd.length === 0) {
        toast.error("Nenhum item deste pedido está disponível agora.", {
          description: "Dá uma olhada no cardápio, tem novidade por lá!",
        });
        return;
      }

      // Uma gaveta aberta no fim, não uma por item.
      for (const { snapshot, quantity } of toAdd) {
        addItem(snapshot, quantity, { openCart: false });
      }
      setOpen(true);

      if (skipped.length > 0) {
        toast.warning(
          `${joinNames(skipped)} ${skipped.length === 1 ? "não está disponível e ficou" : "não estão disponíveis e ficaram"} de fora.`,
        );
      }
    });
  }

  return (
    <Button type="button" variant="outline" className={className} disabled={isPending} onClick={handleClick}>
      <RotateCcw />
      {isPending ? "Montando carrinho..." : "Pedir de novo"}
    </Button>
  );
}
