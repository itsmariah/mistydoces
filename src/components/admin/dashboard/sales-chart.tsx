"use client";

import { useState } from "react";
import type { DailySales } from "@/services/dashboard-service";
import { cn, formatCurrency } from "@/lib/utils";

const axisFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** "2026-09-26" -> "26/09" (a chave já está no fuso da loja, não passa por Date). */
function formatDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

/** Topo do eixo e passo "redondos" (1, 2 ou 5 × 10^n) para no máximo 4 divisões. */
function niceScale(max: number): { top: number; step: number } {
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  return { top: Math.ceil(max / step) * step, step };
}

function describe(day: DailySales): string {
  const orders = day.orders === 1 ? "1 pedido" : `${day.orders} pedidos`;
  return `${formatDay(day.day)}: ${formatCurrency(day.revenue)}, ${orders}`;
}

export function SalesChart({ days }: { days: DailySales[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(...days.map((day) => day.revenue));

  if (max === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma venda nos últimos {days.length} dias.
      </p>
    );
  }

  const { top, step } = niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
  const active = activeIndex === null ? null : days[activeIndex];
  const labeledIndexes = new Set([0, Math.floor(days.length / 2), days.length - 1]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Eixo Y */}
        <div className="relative h-48 w-14 shrink-0" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-xs tabular-nums text-muted-foreground"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {axisFormatter.format(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="relative h-48" onPointerLeave={() => setActiveIndex(null)}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-border"
                style={{ bottom: `${(tick / top) * 100}%` }}
                aria-hidden="true"
              />
            ))}

            <div
              role="group"
              aria-label="Faturamento por dia"
              className="absolute inset-0 flex items-end gap-[2px]"
            >
              {days.map((day, index) => (
                <div
                  key={day.day}
                  role="img"
                  tabIndex={0}
                  aria-label={describe(day)}
                  onPointerEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  className="flex h-full flex-1 cursor-default items-end justify-center rounded-sm outline-offset-2"
                >
                  <div
                    className={cn(
                      "w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity",
                      activeIndex !== null && activeIndex !== index && "opacity-60",
                    )}
                    style={{ height: `${(day.revenue / top) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            {active && activeIndex !== null && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 z-10 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
                style={{
                  left: `${((activeIndex + 0.5) / days.length) * 100}%`,
                  // Nas pontas, ancora o balão para dentro em vez de centralizar e vazar.
                  transform: `translate(${
                    activeIndex < 4 ? "-10%" : activeIndex > days.length - 5 ? "-90%" : "-50%"
                  }, -100%)`,
                }}
              >
                <p className="font-semibold tabular-nums">{formatCurrency(active.revenue)}</p>
                <p className="text-muted-foreground">
                  {formatDay(active.day)} ·{" "}
                  {active.orders === 1 ? "1 pedido" : `${active.orders} pedidos`}
                </p>
              </div>
            )}
          </div>

          {/* Eixo X: só primeiro, meio e último dia — rótulo em toda barra vira ruído. */}
          <div className="relative mt-1 h-4 text-xs text-muted-foreground" aria-hidden="true">
            {days.map((day, index) =>
              labeledIndexes.has(index) ? (
                <span
                  key={day.day}
                  className={cn(
                    "absolute",
                    index === 0 ? "left-0" : index === days.length - 1 ? "right-0" : "-translate-x-1/2",
                  )}
                  style={
                    index !== 0 && index !== days.length - 1
                      ? { left: `${((index + 0.5) / days.length) * 100}%` }
                      : undefined
                  }
                >
                  {formatDay(day.day)}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver em tabela
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Pedidos</th>
              <th className="py-1 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {days
              .filter((day) => day.orders > 0)
              .map((day) => (
                <tr key={day.day} className="border-t border-border">
                  <td className="py-1">{formatDay(day.day)}</td>
                  <td className="py-1 text-right">{day.orders}</td>
                  <td className="py-1 text-right">{formatCurrency(day.revenue)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
