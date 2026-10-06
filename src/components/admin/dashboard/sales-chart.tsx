"use client";

import { useState } from "react";
import Image from "next/image";
import type { DailySales } from "@/services/dashboard-service";
import { cn, formatCurrency, pluralize } from "@/lib/utils";

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

const RANGES = [7, 30] as const;
type Range = (typeof RANGES)[number];

/**
 * Faturamento por dia com seletor de período. Recebe os 30 dias do painel; os 7 dias são
 * o final da mesma série — trocar de período não busca nada no servidor.
 */
export function SalesChart({ days }: { days: DailySales[] }) {
  const [range, setRange] = useState<Range>(7);
  const visible = days.slice(-range);
  // Soma em centavos, como no servidor (o serviço importa Prisma, não dá para usar aqui).
  const revenue = visible.reduce((cents, day) => cents + Math.round(day.revenue * 100), 0) / 100;
  const ordersCount = visible.reduce((sum, day) => sum + day.orders, 0);

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-heading text-lg font-semibold">Faturamento por dia</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(revenue)}
            </span>{" "}
            em {pluralize(ordersCount, "pedido", "pedidos")} nos últimos {range} dias
          </p>
        </div>
        <div
          role="group"
          aria-label="Período do gráfico"
          className="flex rounded-full border border-border p-0.5 text-sm"
        >
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                range === option
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option} dias
            </button>
          ))}
        </div>
      </div>

      {revenue === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Image
            src="/branding/02_gatinha_dormindo.png"
            alt=""
            width={96}
            height={96}
            className="h-auto w-24 dark:brightness-95"
          />
          <p className="text-sm text-muted-foreground">
            Nenhuma venda nos últimos {range} dias. A Misty está esperando o próximo pedido.
          </p>
        </div>
      ) : (
        <Bars key={range} days={visible} />
      )}
    </section>
  );
}

function Bars({ days }: { days: DailySales[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(...days.map((day) => day.revenue));
  const few = days.length <= 7;
  // Nas pontas, o balão ancora para dentro em vez de centralizar e vazar.
  const edge = few ? 1 : 4;
  // Com barras largas o rótulo fica sob a barra; com 30, as pontas encostam na borda.
  const centered = (index: number) => few || (index !== 0 && index !== days.length - 1);

  const { top, step } = niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
  const active = activeIndex === null ? null : days[activeIndex];
  // Com 7 dias cabe o rótulo de todos; com 30, só primeiro, meio e último.
  const labeledIndexes = new Set(
    few ? days.map((_, index) => index) : [0, Math.floor(days.length / 2), days.length - 1],
  );

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
                      "w-full rounded-t-[4px] bg-chart-1 transition-opacity",
                      few ? "max-w-12" : "max-w-6",
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
                  transform: `translate(${
                    activeIndex < edge
                      ? "-10%"
                      : activeIndex > days.length - 1 - edge
                        ? "-90%"
                        : "-50%"
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

          {/* Eixo X: com 30 dias, rótulo em toda barra vira ruído (ver labeledIndexes). */}
          <div className="relative mt-1 h-4 text-xs text-muted-foreground" aria-hidden="true">
            {days.map((day, index) =>
              labeledIndexes.has(index) ? (
                <span
                  key={day.day}
                  className={cn(
                    "absolute",
                    centered(index) ? "-translate-x-1/2" : index === 0 ? "left-0" : "right-0",
                  )}
                  style={
                    centered(index)
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
