"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { flyToCart } from "@/lib/fly-to-cart";
import { cn, formatCurrency } from "@/lib/utils";

/** Quanto tempo o botão mostra o "check" antes de voltar ao "+". */
const ADDED_FEEDBACK_MS = 1500;

export type QuickAddVariant = { id: string; label: string; price: number };

type QuickAddButtonProps = {
  /** Opções à venda, na ordem do cardápio. Com mais de uma, o "+" pergunta qual. */
  variants: QuickAddVariant[];
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  leadTimeDays: number;
};

/**
 * "+" do card do cardápio. Com uma opção, adiciona direto; com várias (ex.: unidade ou
 * caixas), abre um menu para escolher sem sair do cardápio. Não abre a gaveta do carrinho
 * (quem monta um pedido pelo cardápio quer continuar rolando) e oferece "Ver carrinho" no toast.
 */
export function QuickAddButton({
  variants,
  productSlug,
  productName,
  imageUrl,
  leadTimeDays,
}: QuickAddButtonProps) {
  const { addItem, setOpen } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasChoice = variants.length > 1;

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  function addVariant(variant: QuickAddVariant) {
    const add = () =>
      addItem(
        {
          variantId: variant.id,
          productSlug,
          productName,
          variantLabel: variant.label,
          price: variant.price,
          imageUrl,
          leadTimeDays,
        },
        1,
        { openCart: false },
      );
    // A sacola só conta o item quando a miniatura chega nela — o "pulinho" do ícone
    // coincide com a chegada. Sem animação, `flyToCart` resolve na hora.
    if (buttonRef.current) void flyToCart(buttonRef.current, imageUrl).then(add);
    else add();
    const name = hasChoice ? `${productName} (${variant.label})` : productName;
    toast.success(`${name} adicionado ao carrinho`, {
      action: { label: "Ver carrinho", onClick: () => setOpen(true) },
    });
    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  }

  const buttonClassName = cn(
    // `relative z-10`: fica acima do link "esticado" que cobre o card inteiro.
    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-[background-color,transform] active:scale-90",
    justAdded
      ? "bg-success text-success-foreground"
      : "bg-primary text-primary-foreground hover:bg-primary/80 data-popup-open:bg-primary/80",
  );
  const icon = justAdded ? <Check className="size-5" /> : <Plus className="size-5" />;

  if (!hasChoice) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => addVariant(variants[0])}
        aria-label={`Adicionar ${productName} ao carrinho`}
        className={buttonClassName}
      >
        {icon}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={buttonRef}
        aria-label={`Escolher opção de ${productName} para adicionar ao carrinho`}
        className={buttonClassName}
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Adicionar ao carrinho</DropdownMenuLabel>
          {variants.map((variant) => (
            <DropdownMenuItem key={variant.id} onClick={() => addVariant(variant)}>
              <span className="min-w-0 flex-1 truncate">{variant.label}</span>
              <span className="font-medium tabular-nums text-link">
                {formatCurrency(variant.price)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
