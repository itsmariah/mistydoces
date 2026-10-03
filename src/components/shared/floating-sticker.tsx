import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type Sticker = {
  src: string;
  width: number;
  height: number;
  /** Posição (`absolute`) e tamanho, ex.: `"left-0 top-6 w-12"`. */
  className: string;
  /** Inclinação de repouso, ex.: `"-12deg"`. */
  rotate: string;
  /** Atraso negativo começa a animação "no meio": os adesivos não balançam em sincronia. */
  delay: string;
};

/** Adesivo decorativo da marca flutuando devagar. Puramente visual: some para leitores de tela. */
export function FloatingSticker({ src, width, height, className, rotate, delay }: Sticker) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={cn("pointer-events-none absolute h-auto animate-float select-none", className)}
      style={{ "--float-rotate": rotate, animationDelay: delay } as CSSProperties}
    />
  );
}
