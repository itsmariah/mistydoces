"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { cn, formatCurrency } from "@/lib/utils";
import { MAX_ITEM_QUANTITY } from "@/validations/order";

/** Quanto tempo o botão fica em "Adicionado" antes de voltar ao normal. */
const ADDED_FEEDBACK_MS = 1500;

type Variant = { id: string; label: string; price: number };

type VariantSelectorProps = {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variants: Variant[];
  disabled?: boolean;
};

export function VariantSelector({
  productSlug,
  productName,
  imageUrl,
  variants,
  disabled,
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useCart();
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  function handleAdd() {
    if (!selected) return;
    addItem(
      {
        variantId: selected.id,
        productSlug,
        productName,
        variantLabel: selected.label,
        price: selected.price,
        imageUrl,
      },
      quantity,
    );
    setQuantity(1);
    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedId(variant.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                selectedId === variant.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {variant.label}
            </button>
          ))}
        </div>
      )}

      <span className="text-2xl font-semibold text-link">
        {selected ? formatCurrency(selected.price) : ""}
      </span>

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={MAX_ITEM_QUANTITY}
          size="lg"
          disabled={disabled}
        />
        <Button size="lg" disabled={disabled} className="flex-1 sm:flex-none" onClick={handleAdd}>
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Adicionado!
            </>
          ) : quantity > 1 && selected ? (
            `Adicionar ${quantity} · ${formatCurrency(selected.price * quantity)}`
          ) : (
            "Adicionar ao carrinho"
          )}
        </Button>
      </div>
    </div>
  );
}
