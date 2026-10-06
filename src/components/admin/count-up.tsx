"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const DURATION_MS = 700;

const FORMATTERS = {
  currency: (value: number) => formatCurrency(value),
  integer: (value: number) => String(Math.round(value)),
};

/** Desacelera no fim: o número "assenta" no valor em vez de parar de repente. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Número que conta de onde estava até o valor novo (de zero, na primeira vez). Leitores de
 * tela recebem só o valor final; com movimento reduzido, o número já aparece pronto.
 */
export function CountUp({
  value,
  format = "integer",
}: {
  value: number;
  format?: keyof typeof FORMATTERS;
}) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : DURATION_MS;

    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const next = progress === 1 ? value : from + (value - from) * easeOutCubic(progress);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const formatValue = FORMATTERS[format];
  return (
    <>
      <span aria-hidden="true">{formatValue(shown)}</span>
      <span className="sr-only">{formatValue(value)}</span>
    </>
  );
}
