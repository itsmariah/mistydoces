import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Ao lado do título (ex.: um link "Ver todas"). */
  action?: ReactNode;
  /** `fieldset` em formulários: agrupa os campos e permite desabilitar a seção inteira. */
  as?: "section" | "fieldset";
  disabled?: boolean;
  /** Classes do corpo (espaçamento e layout dos campos). */
  className?: string;
  children: ReactNode;
};

/**
 * Seção com título do site: card (`surface`) com uma faixa lilás clarinha no topo. Usada em
 * formulários e detalhes (Configurações, produto, ações do pedido). Caixas sem título usam
 * só a classe `surface`.
 */
export function SectionCard({
  title,
  description,
  action,
  as = "section",
  disabled,
  className,
  children,
}: SectionCardProps) {
  const heading = (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        {as === "fieldset" ? (
          <span className="block font-heading text-lg font-medium text-section-foreground">
            {title}
          </span>
        ) : (
          <h2 className="font-heading text-lg font-medium text-section-foreground">{title}</h2>
        )}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
  const headerClass = "w-full border-b border-border bg-section px-4 py-3";
  const body = <div className={cn("space-y-4 p-4", className)}>{children}</div>;

  if (as === "fieldset") {
    return (
      <fieldset disabled={disabled} className="surface min-w-0 overflow-hidden rounded-lg">
        {/* O legend com float vira um bloco comum: sem ele, o navegador o desenha "cortando" a borda. */}
        <legend className={cn("float-left", headerClass)}>{heading}</legend>
        <div className="clear-both">{body}</div>
      </fieldset>
    );
  }

  return (
    <section className="surface min-w-0 overflow-hidden rounded-lg">
      <div className={headerClass}>{heading}</div>
      {body}
    </section>
  );
}
