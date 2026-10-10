"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ClickedCover = { coverUrl: string | null; categorySlug: string };

/**
 * Capa do último card clicado, por slug (`coverUrl: null` = produto sem foto, que mostra a
 * ilustração da categoria). A tela de carregamento
 * do produto não recebe dados do servidor: é daqui que ela tira a foto para mostrar no
 * lugar certo enquanto a página carrega — e a foto "viaja" do card até lá.
 */
const clickedCovers = new Map<string, ClickedCover>();

export function getClickedProductCover(slug: string): ClickedCover | undefined {
  return clickedCovers.get(slug);
}

export function ProductCardLink({
  slug,
  coverUrl,
  categorySlug,
  className,
  children,
}: {
  slug: string;
  coverUrl: string | null;
  categorySlug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/cardapio/${slug}`}
      className={className}
      onClick={() => clickedCovers.set(slug, { coverUrl, categorySlug })}
    >
      {children}
    </Link>
  );
}
