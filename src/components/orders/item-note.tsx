import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/** Personalização de um item (carrinho, checkout, pedido): ✎ “Parabéns, Ana!”. */
export function ItemNote({ note, className }: { note: string | null | undefined; className?: string }) {
  if (!note) return null;
  return (
    <span className={cn("flex items-start gap-1 text-xs text-secondary-foreground", className)}>
      <PenLine className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">Personalização: </span>
      <span className="min-w-0 break-words">&ldquo;{note}&rdquo;</span>
    </span>
  );
}
