"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

type Variant = { id: string; label: string; price: number };

type VariantSelectorProps = {
  variants: Variant[];
  disabled?: boolean;
};

export function VariantSelector({ variants, disabled }: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

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

      <Button size="lg" disabled={disabled} className="w-full sm:w-fit">
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
