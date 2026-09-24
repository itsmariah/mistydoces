"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** No carrinho é 0 (diminuir de 1 remove o item); na página do produto é 1. */
  min?: number;
  max: number;
  size?: "sm" | "lg";
  disabled?: boolean;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "sm",
  disabled,
}: QuantityStepperProps) {
  const buttonSize = size === "lg" ? "icon-lg" : "icon-xs";
  const iconClass = size === "lg" ? "h-4 w-4" : "h-3 w-3";

  return (
    <div className={cn("flex items-center", size === "lg" ? "gap-3" : "gap-2")}>
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus className={iconClass} />
      </Button>
      <span
        aria-live="polite"
        className={cn("text-center tabular-nums", size === "lg" ? "w-6 text-base font-medium" : "w-4 text-sm")}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className={iconClass} />
      </Button>
    </div>
  );
}
