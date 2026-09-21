import Link from "next/link";
import { cn } from "@/lib/utils";

/** Ícone de pata estilizado — único ponto de referência ao gato que dá nome à marca (ver ETAPA 9). */
function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="16" rx="6" ry="5" />
      <ellipse cx="5" cy="9" rx="2.1" ry="2.6" />
      <ellipse cx="10" cy="5.5" rx="2.1" ry="2.6" />
      <ellipse cx="14" cy="5.5" rx="2.1" ry="2.6" />
      <ellipse cx="19" cy="9" rx="2.1" ry="2.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-1.5 font-heading text-xl font-semibold text-foreground",
        className,
      )}
    >
      <PawIcon className="h-5 w-5 text-primary" />
      <span>
        Misty<span className="text-primary">Doces</span>
      </span>
    </Link>
  );
}
