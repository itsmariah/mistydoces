"use client";

import { ViewTransition } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getClickedProductCover } from "@/components/catalog/product-card-link";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { PRODUCT_CARD_IMAGE_SIZES, productImageTransitionName } from "@/lib/view-transitions";

/**
 * Vindo de um card, a foto do produto já aparece aqui com o mesmo nome de View Transition
 * da galeria: ela viaja do card para cá e depois "assenta" na galeria quando a página chega.
 * Sem card clicado (link direto, recarregar), fica o esqueleto comum.
 */
function CoverPhoto({ slug }: { slug: string }) {
  const cover = getClickedProductCover(slug);
  if (cover === undefined) return <Skeleton className="aspect-square w-full rounded-2xl" />;

  return (
    <ViewTransition name={productImageTransitionName(slug)} share="product-image" default="none">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" sizes={PRODUCT_CARD_IMAGE_SIZES} />
        ) : (
          <ProductPlaceholderImage className="object-contain p-10" />
        )}
      </div>
    </ViewTransition>
  );
}

export default function ProdutoLoading() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12" aria-busy="true">
      <span className="sr-only">Carregando o produto…</span>
      <Skeleton className="h-5 w-36" />

      <div className="grid gap-8 sm:grid-cols-2">
        <CoverPhoto slug={slug} />

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-full sm:w-64" />
        </div>
      </div>
    </div>
  );
}
