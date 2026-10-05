"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  availableDays,
  dayChipLabel,
  formatLeadTimeLong,
  formatSlotRange,
  type SchedulingRules,
} from "@/lib/scheduling";
import { minutesOfDay, storeInstant, toDayKey } from "@/lib/store-time";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

/** De quanto em quanto tempo as janelas são recalculadas (as que passaram somem). */
const REFRESH_MS = 60 * 1000;

const CHIP_CLASS =
  "rounded-xl border px-3 py-2 text-sm transition-colors focus-visible:outline-offset-2 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:border-primary";

/**
 * Escolha do dia e da janela de entrega/retirada. Sempre deixa uma janela marcada: a
 * primeira livre ("mais cedo") já vem escolhida, e se a marcada deixar de existir (o
 * tempo passou, mudou o carrinho) volta para a primeira livre. O servidor confere de novo.
 */
export function SchedulePicker({
  rules,
  leadTimeDays,
  leadProductNames,
  deliveryType,
  value,
  onChange,
  error,
}: {
  rules: SchedulingRules;
  /** Maior antecedência do carrinho. */
  leadTimeDays: number;
  /** Itens que definem esse prazo, para explicar por que as datas começam mais tarde. */
  leadProductNames: string[];
  deliveryType: "DELIVERY" | "PICKUP";
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
}) {
  const mounted = useMounted();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const days = useMemo(() => availableDays(rules, now, leadTimeDays), [rules, now, leadTimeDays]);

  const selected = value ? new Date(value) : null;
  const selectedDayKey = selected ? toDayKey(selected) : null;
  const selectedSlot = selected ? minutesOfDay(selected) : null;
  const selectedDay = days.find((day) => day.dayKey === selectedDayKey);
  const isValid = selectedDay && selectedSlot !== null && selectedDay.slots.includes(selectedSlot);

  const firstDay = days[0];
  const fallback = firstDay ? storeInstant(firstDay.dayKey, firstDay.slots[0]).toISOString() : undefined;

  // Mantém sempre uma janela válida marcada (ou nenhuma, se não houver janela livre).
  useEffect(() => {
    if (!mounted) return;
    if (!isValid && value !== fallback) onChange(fallback);
  }, [mounted, isValid, value, fallback, onChange]);

  const verb = deliveryType === "DELIVERY" ? "receber" : "retirar";

  if (!mounted) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
        Não há horários livres nos próximos dias. Fale com a loja para combinar o seu pedido.
      </p>
    );
  }

  const activeDay = isValid ? selectedDay : firstDay;

  return (
    <div className="space-y-4">
      {leadTimeDays > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-sm text-secondary-foreground">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {formatLeadTimeLong(leadTimeDays)}
            {leadProductNames.length > 0 && ` (${leadProductNames.join(", ")})`}. Por isso as
            datas começam um pouco mais tarde.
          </span>
        </p>
      )}

      <div className="space-y-2">
        <p id="quando-dia" className="text-sm font-medium">
          Dia
        </p>
        {/* Rola de lado no celular; -mx/px deixa o último dia encostar na borda da tela. */}
        <div
          role="group"
          aria-labelledby="quando-dia"
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {days.map((day) => {
            const label = dayChipLabel(day.dayKey, now);
            return (
              <button
                key={day.dayKey}
                type="button"
                aria-pressed={day.dayKey === activeDay.dayKey}
                onClick={() => onChange(storeInstant(day.dayKey, day.slots[0]).toISOString())}
                className={cn(CHIP_CLASS, "flex min-w-16 shrink-0 snap-start flex-col items-center")}
              >
                <span className="font-medium">{label.title}</span>
                <span className="text-xs opacity-80">{label.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p id="quando-horario" className="text-sm font-medium">
          Horário para {verb}
        </p>
        <div
          role="group"
          aria-labelledby="quando-horario"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {activeDay.slots.map((slot, index) => {
            const isEarliest = activeDay.dayKey === firstDay.dayKey && index === 0;
            return (
              <button
                key={slot}
                type="button"
                aria-pressed={isValid ? slot === selectedSlot : isEarliest}
                onClick={() => onChange(storeInstant(activeDay.dayKey, slot).toISOString())}
                className={cn(CHIP_CLASS, "flex flex-col items-center")}
              >
                <span className="font-medium">{formatSlotRange(slot)}</span>
                {isEarliest && <span className="text-[0.7rem] opacity-80">mais cedo</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
