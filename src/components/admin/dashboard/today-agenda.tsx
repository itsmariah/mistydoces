import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatSlotRange } from "@/lib/scheduling";
import { minutesOfDay } from "@/lib/store-time";
import type { AgendaDay } from "@/services/agenda-service";

const PRODUCTION_PREVIEW = 4;

/** Resumo do dia no painel: quantos pedidos, o próximo horário e o que produzir. */
export function TodayAgenda({ day, now }: { day: AgendaDay; now: Date }) {
  const count = day.orders.length;
  const next = day.orders.find((order) => order.scheduledFor.getTime() >= now.getTime());
  const extra = day.production.length - PRODUCTION_PREVIEW;

  return (
    <section className="space-y-3 rounded-lg surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <CalendarDays className="size-5 text-link" aria-hidden="true" />
          Agenda de hoje
        </h2>
        <Link href="/admin/agenda" className="text-sm text-link hover:underline">
          Ver semana →
        </Link>
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">Dia livre: nenhum pedido agendado para hoje.</p>
      ) : (
        <>
          <p className="text-sm">
            <span className="text-2xl font-semibold">{count}</span>{" "}
            {count === 1 ? "pedido agendado" : "pedidos agendados"}
            {next && (
              <span className="text-muted-foreground">
                {" "}
                · próximo às {formatSlotRange(minutesOfDay(next.scheduledFor))} (#{next.orderNumber})
              </span>
            )}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {day.production.slice(0, PRODUCTION_PREVIEW).map((line) => (
              <li
                key={`${line.productName}-${line.variantLabel}`}
                className="rounded-full bg-muted px-2.5 py-1 text-sm"
              >
                <span className="font-semibold">{line.quantity}x</span> {line.productName}
              </li>
            ))}
            {extra > 0 && (
              <li className="px-1 py-1 text-sm text-muted-foreground">e mais {extra}</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
