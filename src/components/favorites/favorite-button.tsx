"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Direção de cada mini coração (6, espalhados em volta, levemente para cima). */
const BURST = [0, 60, 120, 180, 240, 300].map((angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { "--burst-x": `${Math.round(Math.cos(radians) * 26)}px`, "--burst-y": `${Math.round(Math.sin(radians) * 26) - 4}px` };
});

/** Mini corações lilás saindo do botão — só ao favoritar, não ao remover. */
function HeartBurst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {BURST.map((style, index) => (
        <Heart
          key={index}
          style={style as CSSProperties}
          className="absolute top-1/2 left-1/2 size-2.5 animate-heart-burst fill-script text-script"
        />
      ))}
    </span>
  );
}

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
  // Muda a cada favoritada: remonta o coração (pop) e os mini corações (burst).
  const [burstKey, setBurstKey] = useState(0);

  function handleToggle() {
    if (!active) setBurstKey((key) => key + 1);
    toggle(productId, productName);
  }
  const label = active
    ? `Remover ${productName} dos favoritos`
    : `Salvar ${productName} nos favoritos`;

  const icon = (
    <span key={burstKey} className={cn("relative flex", burstKey > 0 && active && "animate-pop")}>
      <Heart
        className={cn("size-4 transition-transform", active && "scale-110 fill-current")}
        aria-hidden="true"
      />
      {burstKey > 0 && active && <HeartBurst />}
    </span>
  );

  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={active}
        onClick={handleToggle}
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
      onClick={handleToggle}
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
