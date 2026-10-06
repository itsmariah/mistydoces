"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Capa do último card clicado, por slug (`null` = produto sem foto). A tela de carregamento
 * do produto não recebe dados do servidor: é daqui que ela tira a foto para mostrar no
 * lugar certo enquanto a página carrega — e a foto "viaja" do card até lá.
 */
const clickedCovers = new Map<string, string | null>();

export function getClickedProductCover(slug: string): string | null | undefined {
  return clickedCovers.get(slug);
}

export function ProductCardLink({
  slug,
  coverUrl,
  className,
  children,
}: {
  slug: string;
  coverUrl: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/cardapio/${slug}`}
      className={className}
      onClick={() => clickedCovers.set(slug, coverUrl)}
    >
      {children}
    </Link>
  );
}
