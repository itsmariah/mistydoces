import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: ReactNode;
  /** Vai no h2 — use o mesmo valor no `aria-labelledby` da seção. */
  id?: string;
  /** Frase cursiva (Caveat) acima do título. */
  kicker?: ReactNode;
  description?: ReactNode;
  /** Arquivo de `public/branding/` — sempre decorativo. */
  image?: { src: string; width: number; height: number };
  /** Link "ver tudo": abaixo do texto quando centralizado, à direita quando alinhado à esquerda. */
  link?: { href: string; label: string };
  /** `center` nas seções soltas (home); `start` quando o conteúdo abaixo é alinhado à esquerda. */
  align?: "center" | "start";
  className?: string;
};

/** Cabeçalho padrão das seções da loja: frase cursiva + título (h2) + link opcional. */
export function SectionHeader({
  title,
  id,
  kicker,
  description,
  image,
  link,
  align = "center",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  const linkNode = link && (
    <Link
      href={link.href}
      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-link hover:underline"
    >
      {link.label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );

  return (
    <div
      className={cn(
        "flex gap-2",
        centered
          ? "flex-col items-center text-center"
          : "flex-wrap items-end justify-between gap-x-4",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-1", centered && "items-center")}>
        {image && (
          <Image
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            className="mb-1 h-auto max-w-full"
          />
        )}
        {kicker && <p className="font-display text-xl text-script">{kicker}</p>}
        <h2 id={id} className="text-balance font-heading text-2xl font-semibold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {linkNode}
    </div>
  );
}
