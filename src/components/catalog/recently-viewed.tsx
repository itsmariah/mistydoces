"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getRecentlyViewedProducts, type RecentlyViewedProduct } from "@/actions/catalog";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import {
  RECENTLY_VIEWED_STORAGE_KEY,
  parseRecentlyViewed,
  pushRecentlyViewed,
} from "@/lib/recently-viewed";
import { cn, formatCurrency } from "@/lib/utils";

function readStored(): string[] {
  try {
    return parseRecentlyViewed(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeStored(slugs: string[]) {
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Armazenamento bloqueado (aba anônima etc.): só não lembra dos vistos.
  }
}

/**
 * Fileira "Vistos recentemente". Na página de um produto, `currentSlug` registra a visita e
 * fica de fora da lista. Os slugs ficam no localStorage, mas nome, foto e preço vêm sempre
 * do servidor — nada de preço desatualizado guardado no navegador.
 */
export function RecentlyViewed({
  currentSlug,
  className,
}: {
  currentSlug?: string;
  className?: string;
}) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    const stored = readStored();
    if (currentSlug) writeStored(pushRecentlyViewed(stored, currentSlug));

    const toShow = stored.filter((slug) => slug !== currentSlug);
    if (toShow.length === 0) return;

    let cancelled = false;
    getRecentlyViewedProducts(toShow).then((result) => {
      if (!cancelled && result.success) setProducts(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="vistos-titulo"
      className={cn("space-y-4 border-t border-border pt-8", className)}
    >
      <h2 id="vistos-titulo" className="font-heading text-lg font-medium">
        Vistos recentemente
      </h2>
      {/* Rola de lado no celular; o -mx/px deixa o último card encostar na borda da tela. */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {products.map((product) => (
          <li key={product.slug} className="w-36 shrink-0 snap-start">
            <Link
              href={`/cardapio/${product.slug}`}
              className="group block space-y-2 rounded-xl focus-visible:outline-offset-4"
            >
              <span className="relative block aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    sizes="144px"
                    className={cn(
                      "object-cover transition-transform group-hover:scale-105",
                      !product.isAvailable && "opacity-60",
                    )}
                  />
                ) : (
                  <ProductPlaceholderImage className="object-contain p-4" />
                )}
              </span>
              <span className="block truncate text-sm font-medium group-hover:underline">
                {product.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {product.isAvailable
                  ? `${product.hasOptions ? "A partir de " : ""}${formatCurrency(product.startingPrice)}`
                  : "Esgotado no momento"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
