import type { HoursInfo } from "@/lib/store-contact";
import { cn } from "@/lib/utils";

/** Horário semanal agrupado ("Seg a sáb · 13h às 21h") + a observação livre da loja. */
export function HoursList({ hours, className }: { hours: HoursInfo; className?: string }) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {hours.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {hours.note && <p className="text-muted-foreground">{hours.note}</p>}
    </div>
  );
}
