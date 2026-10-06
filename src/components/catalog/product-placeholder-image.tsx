import Image from "next/image";
import { cn } from "@/lib/utils";

/** Ilustração usada sempre que um produto ainda não tem foto cadastrada. */
export function ProductPlaceholderImage({
  className,
  preload,
}: {
  className?: string;
  /** Na página do produto ela é o maior elemento da tela: carrega antes, sem `lazy`. */
  preload?: boolean;
}) {
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
