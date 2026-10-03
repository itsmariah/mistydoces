import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

type OptionCardProps = {
  value: string;
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Destaque à direita do título (ex.: "+R$ 8,00", "Grátis"). */
  aside?: ReactNode;
};

/**
 * Opção de um `RadioGroup` em formato de card: o card inteiro é clicável (é o `<label>`
 * do rádio) e fica destacado quando o rádio de dentro está marcado.
 */
export function OptionCard({ value, icon: Icon, title, description, aside }: OptionCardProps) {
  return (
    <Label className="cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 leading-normal transition-colors hover:border-primary has-data-checked:border-primary has-data-checked:bg-accent has-data-checked:ring-1 has-data-checked:ring-primary">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span>{title}</span>
          {aside && <span className="shrink-0 font-semibold text-link">{aside}</span>}
        </span>
        {description && (
          <span className="text-xs font-normal text-muted-foreground">{description}</span>
        )}
      </span>
      <RadioGroupItem value={value} className="mt-1" />
    </Label>
  );
}
