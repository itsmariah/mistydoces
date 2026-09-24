import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** Arquivo de `public/branding/` — sempre decorativo, o texto carrega o significado. */
  image: { src: string; width: number; height: number };
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Estado vazio com ilustração da Misty — usado onde uma lista pode não ter itens. */
export function EmptyState({ image, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      <Image
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        className="h-auto max-w-full"
      />
      <p className="font-display text-2xl text-link">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
