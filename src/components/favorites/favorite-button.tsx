"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Coração de favoritar. `overlay`: redondo, sobre a foto do card; `inline`: botão com
 * texto, na página do produto.
 */
export function FavoriteButton({
  productId,
  productName,
  variant = "overlay",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(productId);
  const label = active
    ? `Remover ${productName} dos favoritos`
    : `Salvar ${productName} nos favoritos`;

  const icon = (
    <Heart
      className={cn("size-4 transition-transform", active && "scale-110 fill-current")}
      aria-hidden="true"
    />
  );

  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={active}
        onClick={() => toggle(productId, productName)}
        className={cn(active && "text-secondary-foreground", className)}
      >
        {icon}
        {active ? "Nos favoritos" : "Favoritar"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={() => toggle(productId, productName)}
      className={cn(
        // `relative z-10`: fica acima do link "esticado" que cobre o card inteiro.
        "relative z-10 flex size-9 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background active:scale-90",
        active ? "text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {icon}
    </button>
  );
}

/** Coração do header com a contagem — atalho para a página de favoritos. */
export function FavoritesLink() {
  const { count } = useFavorites();
  return (
    <Button
      variant="ghost"
      size="icon"
      nativeButton={false}
      render={<Link href="/favoritos" />}
      aria-label={count > 0 ? `Favoritos (${count})` : "Favoritos"}
      className="relative"
    >
      <Heart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary-foreground px-1 text-[10px] font-semibold text-background">
          {count}
        </span>
      )}
    </Button>
  );
}
