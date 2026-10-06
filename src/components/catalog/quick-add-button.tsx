"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-provider";
import { flyToCart } from "@/lib/fly-to-cart";
import { cn } from "@/lib/utils";

/** Quanto tempo o botão mostra o "check" antes de voltar ao "+". */
const ADDED_FEEDBACK_MS = 1500;

type QuickAddButtonProps = {
  variantId: string;
  variantLabel: string;
  price: number;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  leadTimeDays: number;
};

/**
 * "+" do card do cardápio, só para produtos com uma única opção. Adiciona sem abrir a
 * gaveta do carrinho (quem monta um pedido pelo cardápio quer continuar rolando) e
 * oferece "Ver carrinho" no toast.
 */
export function QuickAddButton({
  variantId,
  variantLabel,
  price,
  productSlug,
  productName,
  imageUrl,
  leadTimeDays,
}: QuickAddButtonProps) {
  const { addItem, setOpen } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  function handleClick() {
    const add = () =>
      addItem(
        { variantId, productSlug, productName, variantLabel, price, imageUrl, leadTimeDays },
        1,
        { openCart: false },
      );
    // A sacola só conta o item quando a miniatura chega nela — o "pulinho" do ícone
    // coincide com a chegada. Sem animação, `flyToCart` resolve na hora.
    if (buttonRef.current) void flyToCart(buttonRef.current, imageUrl).then(add);
    else add();
    toast.success(`${productName} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => setOpen(true) },
    });
    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label={`Adicionar ${productName} ao carrinho`}
      className={cn(
        // `relative z-10`: fica acima do link "esticado" que cobre o card inteiro.
        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-[background-color,transform] active:scale-90",
        justAdded
          ? "bg-success text-success-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/80",
      )}
    >
      {justAdded ? <Check className="size-5" /> : <Plus className="size-5" />}
    </button>
  );
}
