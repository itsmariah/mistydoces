"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { cn, formatCurrency } from "@/lib/utils";

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
  const { addItem } = useCart();
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

  function handleAdd() {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productSlug,
      productName,
      variantLabel: selected.label,
      price: selected.price,
      imageUrl,
    });
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

      <span className="text-2xl font-semibold text-primary">
        {selected ? formatCurrency(selected.price) : ""}
      </span>

      <Button size="lg" disabled={disabled} className="w-full sm:w-fit" onClick={handleAdd}>
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
