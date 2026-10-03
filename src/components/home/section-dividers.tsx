import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Borda ondulada de uma seção com fundo colorido. A cor vem de `text-*` (o SVG pinta com
 * `currentColor`), então basta usar a mesma cor do fundo da seção, ex.: `text-accent/40`.
 */
export function Wave({ flip = false, className }: { flip?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      // `-my-px` cobre a linha de 1px que às vezes aparece entre a onda e o bloco colorido.
      className={cn("-my-px block h-6 w-full sm:h-10", flip && "rotate-180", className)}
    >
      <path
        fill="currentColor"
        d="M0 48V30C180 6 360 0 540 12s360 36 540 30 270-24 360-30v36Z"
      />
    </svg>
  );
}

/** Separador entre seções de mesmo fundo: linha · bordado de corações · linha. */
export function HeartsDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("mx-auto flex max-w-sm items-center gap-4 px-4", className)}>
      <span className="h-px flex-1 bg-border" />
      <Image src="/branding/32_bordado_de_coracoes.png" alt="" width={84} height={40} />
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
