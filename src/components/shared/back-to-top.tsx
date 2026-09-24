"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** A partir de quantos pixels rolados o botão aparece — em páginas curtas ele nunca surge. */
const SHOW_AFTER_PX = 600;
const RING_RADIUS = 25;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function getScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  // Arredonda para não re-renderizar a cada pixel rolado.
  return Math.round((window.scrollY / scrollable) * 100) / 100;
}

function getIsPastThreshold() {
  return window.scrollY > SHOW_AFTER_PX;
}

export function BackToTop() {
  const progress = useSyncExternalStore(subscribe, getScrollProgress, () => 0);
  const visible = useSyncExternalStore(subscribe, getIsPastThreshold, () => false);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      // `inert` tira o botão escondido da navegação por teclado e leitores de tela.
      inert={!visible}
      className={cn(
        "group fixed right-4 bottom-[calc(1rem+var(--sticky-bar-height,0px))] z-40 flex size-14 items-center justify-center rounded-full bg-background/90 shadow-lg shadow-secondary-foreground/15 backdrop-blur transition-[opacity,translate,scale,bottom] duration-300 outline-none hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <circle cx="28" cy="28" r={RING_RADIUS} className="fill-none stroke-border" strokeWidth="3" />
        <circle
          cx="28"
          cy="28"
          r={RING_RADIUS}
          className="fill-none stroke-link transition-[stroke-dashoffset] duration-150"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <span className="relative flex flex-col items-center">
        <ChevronUp className="-mb-1 h-4 w-4 text-link transition-transform group-hover:-translate-y-0.5" />
        <Image src="/branding/13_rostinho_da_misty.png" alt="" width={26} height={25} />
      </span>
    </button>
  );
}
