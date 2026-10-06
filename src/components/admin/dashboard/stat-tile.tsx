import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Trend = { percent: number | null; label: string };

/** "↑ 12% vs. ontem" — verde na alta, vermelho na queda; some sem base de comparação. */
function TrendLine({ percent, label }: Trend) {
  if (percent === null) return null;
  const up = percent > 0;
  const down = percent < 0;
  const Icon = down ? ArrowDownRight : ArrowUpRight;

  return (
    <p
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        up && "text-success-foreground",
        down && "text-destructive",
        !up && !down && "text-muted-foreground",
      )}
    >
      {(up || down) && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span>
        {up ? "+" : ""}
        {percent}% <span className="font-normal text-muted-foreground">{label}</span>
      </span>
    </p>
  );
}

/** Indicador compacto da faixa do topo: ícone, rótulo, número e um complemento. */
export function StatTile({
  icon: Icon,
  label,
  value,
  detail,
  trend,
  href,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: ReactNode;
  trend?: Trend;
  /** Quando há página com o detalhe, o card inteiro vira link. */
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground sm:size-8">
          <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
        </span>
        <h2 className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</h2>
      </div>
      <p className="font-heading text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      {children}
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      {trend && <TrendLine {...trend} />}
    </>
  );

  const className = "flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-card p-3 sm:p-4";
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:border-link/40 hover:bg-accent/40")}>
      {body}
    </Link>
  ) : (
    <section className={className}>{body}</section>
  );
}
