import { CalendarClock } from "lucide-react";
import type { DeliveryType } from "@/generated/prisma/client";
import { formatScheduledFor } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

/**
 * "Entrega agendada · sábado, 10 de outubro · 15h–16h". Não aparece em pedidos antigos,
 * feitos antes do agendamento existir (sem `scheduledFor`).
 */
export function ScheduledFor({
  scheduledFor,
  deliveryType,
  className,
}: {
  scheduledFor: Date | null;
  deliveryType: DeliveryType;
  className?: string;
}) {
  if (!scheduledFor) return null;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl bg-secondary/60 p-4", className)}>
      <CalendarClock className="mt-0.5 size-5 shrink-0 text-secondary-foreground" aria-hidden="true" />
      <div>
        <p className="text-xs font-medium text-secondary-foreground">
          {deliveryType === "DELIVERY" ? "Entrega agendada" : "Retirada agendada"}
        </p>
        <p className="font-medium first-letter:uppercase">{formatScheduledFor(scheduledFor)}</p>
      </div>
    </div>
  );
}
