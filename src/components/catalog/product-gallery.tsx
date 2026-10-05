"use client";

import { useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { productImageTransitionName } from "@/lib/view-transitions";
import { cn } from "@/lib/utils";

const ARROW_BUTTON =
  "absolute top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-sm transition-opacity hover:bg-background disabled:opacity-0 sm:flex";

/**
 * Fotos do produto. No celular, arrasta de lado (rolagem com encaixe, sem biblioteca) e
 * as bolinhas mostram a posição; no desktop, setas e miniaturas. Tocar na foto abre em
 * tela cheia. A capa é a primeira e é ela que "viaja" do card (View Transition).
 */
export function ProductGallery({
  images,
  productName,
  productSlug,
}: {
  images: string[];
  productName: string;
  productSlug: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState(0);
  const hasMany = images.length > 1;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  }

  function step(delta: number) {
    const next = Math.min(Math.max(current + delta, 0), images.length - 1);
    goTo(next);
    // Na tela cheia não há rolagem para atualizar o índice: atualiza direto.
    setCurrent(next);
  }

  if (images.length === 0) {
    return (
      <ViewTransition name={productImageTransitionName(productSlug)} share="product-image" default="none">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <ProductPlaceholderImage className="object-contain p-10" />
        </div>
      </ViewTransition>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative">
        <ViewTransition name={productImageTransitionName(productSlug)} share="product-image" default="none">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setCurrent(index);
                  dialogRef.current?.showModal();
                }}
                aria-label={`Ampliar foto ${index + 1} de ${images.length}`}
                className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
              >
                <Image
                  src={url}
                  alt={index === 0 ? productName : ""}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  preload={index === 0}
                />
              </button>
            ))}
          </div>
        </ViewTransition>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <ZoomIn className="size-4" />
        </span>

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={current === 0}
              aria-label="Foto anterior"
              className={cn(ARROW_BUTTON, "left-3")}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={current === images.length - 1}
              aria-label="Próxima foto"
              className={cn(ARROW_BUTTON, "right-3")}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>

            {/* Bolinhas só no celular; no desktop as miniaturas fazem esse papel. */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
              {images.map((url, index) => (
                <span
                  key={url}
                  className={cn(
                    "size-1.5 rounded-full bg-background/70 transition-all",
                    index === current && "w-4 bg-background",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMany && (
        <div className="hidden gap-2 sm:flex">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver foto ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              className={cn(
                "relative size-16 overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                index === current ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* <dialog> nativo: Esc fecha, o foco fica preso e o fundo não rola. */}
      <dialog
        ref={dialogRef}
        aria-label={`Fotos de ${productName}`}
        onClick={(event) => {
          // Clique no fundo escuro (fora da foto) fecha.
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        className="m-auto h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/85"
      >
        <div className="pointer-events-none relative flex h-full w-full items-center justify-center p-4">
          <div className="pointer-events-auto relative h-full max-h-[85dvh] w-full max-w-3xl">
            <Image
              src={images[current]}
              alt={`${productName} — foto ${current + 1} de ${images.length}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fechar"
          className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={current === 0}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={current === images.length - 1}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-sm">
              {current + 1} / {images.length}
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}
