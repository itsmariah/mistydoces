import Image from "next/image";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";

const MAX_THUMBNAILS = 3;

/** Fotinhos sobrepostos dos itens de um pedido (até 3, e um "+N" para o resto). Só decoração. */
export function OrderItemThumbnails({ images }: { images: (string | null)[] }) {
  const visible = images.slice(0, MAX_THUMBNAILS);
  const hidden = images.length - visible.length;

  return (
    <div aria-hidden="true" className="flex shrink-0 -space-x-3">
      {visible.map((src, index) => (
        <span
          key={index}
          className="relative size-10 overflow-hidden rounded-full border-2 border-card bg-muted"
        >
          {src ? (
            <Image src={src} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <ProductPlaceholderImage className="object-contain p-1" />
          )}
        </span>
      ))}
      {hidden > 0 && (
        <span className="flex size-10 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-semibold text-secondary-foreground">
          +{hidden}
        </span>
      )}
    </div>
  );
}

/** "Brigadeiro, Bolo de pote e mais 2" — resumo em texto dos itens de um pedido. */
export function summarizeOrderItems(names: string[], max = 2): string {
  if (names.length <= max) return names.join(" e ");
  return `${names.slice(0, max).join(", ")} e mais ${names.length - max}`;
}
