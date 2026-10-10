import Image from "next/image";
import { categoryIllustration } from "@/lib/category-illustrations";
import { cn } from "@/lib/utils";

/**
 * Ilustração usada sempre que um produto ainda não tem foto cadastrada.
 *
 * Com `categorySlug`, mostra a ilustração da categoria sobre um círculo lilás — assim uma
 * grade inteira sem fotos não vira uma parede de gatinhas iguais. Sem ele (miniaturas de
 * carrinho, pedidos…), fica a chef Misty de pé.
 */
export function ProductPlaceholderImage({
  className,
  preload,
  categorySlug,
}: {
  className?: string;
  /** Na página do produto ela é o maior elemento da tela: carrega antes, sem `lazy`. */
  preload?: boolean;
  categorySlug?: string;
}) {
  if (categorySlug) {
    return (
      <>
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-3/5 -translate-1/2 rounded-full bg-secondary/70 dark:bg-primary/15"
        />
        <Image
          src={categoryIllustration(categorySlug)}
          alt=""
          fill
          // As ilustrações têm até ~300px de largura: nunca vale a pena pedir uma versão maior.
          sizes="300px"
          preload={preload}
          className={cn("object-contain p-[26%] dark:brightness-95", className)}
        />
      </>
    );
  }

  return (
    <Image
      src="/branding/17_gatinha_chefe_de_pe.png"
      alt=""
      fill
      // O arquivo tem 272px de largura: nunca vale a pena pedir uma versão maior que isso.
      sizes="272px"
      preload={preload}
      className={cn("object-contain p-4", className)}
    />
  );
}
