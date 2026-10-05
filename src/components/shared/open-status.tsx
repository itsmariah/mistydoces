"use client";

import { useEffect, useState } from "react";
import { describeOpenStatus, getOpenStatus, type StoreSchedule } from "@/lib/store-hours";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60 * 1000;

/**
 * "Aberto agora · até 21h" / "Fechado · abre amanhã às 13h". Calculado no navegador: as
 * páginas da loja podem vir de cache, e o status precisa ser o de agora, não o da geração.
 */
export function OpenStatus({ schedule, className }: { schedule: StoreSchedule; className?: string }) {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  // Antes da hidratação não há "agora" confiável: reserva o espaço sem texto.
  if (!mounted) return <span className={cn("inline-block h-5", className)} aria-hidden="true" />;

  const status = getOpenStatus(schedule, now);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 shrink-0 rounded-full",
          status.isOpen ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
      />
      {describeOpenStatus(status, now)}
    </span>
  );
}
