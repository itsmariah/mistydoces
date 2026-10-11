import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  /** Frase cursiva (Caveat) acima do título — o "tom de voz" da página. */
  kicker?: ReactNode;
  description?: ReactNode;
  /** Arquivo de `public/branding/` — sempre decorativo. */
  image?: { src: string; width: number; height: number };
  /** Conteúdo extra abaixo do texto (busca, status, botões). */
  children?: ReactNode;
  className?: string;
};

/**
 * Cabeçalho padrão das páginas da loja: ilustração opcional + frase cursiva + título (h1) +
 * subtítulo, sempre centralizados. Seções dentro da página usam `SectionHeader`.
 */
export function PageHeader({
  title,
  kicker,
  description,
  image,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col items-center gap-4 text-center", className)}>
      {image && (
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          className="h-auto max-w-full"
        />
      )}
      <div className="space-y-2">
        {kicker && <p className="font-display text-2xl text-script">{kicker}</p>}
        <h1 className="text-balance font-heading text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description && (
          <div className="mx-auto max-w-xl text-balance text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
    </header>
  );
}
