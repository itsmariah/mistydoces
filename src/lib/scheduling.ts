import { formatTime, hoursOn, relativeDayLabel, toMinutes, type StoreSchedule } from "@/lib/store-hours";
import { addDays, minutesOfDay, storeInstant, toDayKey, weekdayOf } from "@/lib/store-time";

/** Duração de cada janela de entrega/retirada. */
export const SLOT_MINUTES = 60;

/** Mesmos padrões do schema do Prisma, para quando a loja ainda não salvou as configurações. */
export const DEFAULT_PREP_MINUTES = 60;
export const DEFAULT_MAX_ADVANCE_DAYS = 30;

/** Tudo que decide quais janelas o cliente pode escolher (vem das configurações da loja). */
export type SchedulingRules = StoreSchedule & { prepMinutes: number; maxAdvanceDays: number };

/** Um dia com as janelas livres, em minutos desde a meia-noite (relógio da loja). */
export type AvailableDay = { dayKey: string; slots: number[] };

function daysLabel(days: number): string {
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/** Selo do card: "Encomenda · 2 dias". */
export function formatLeadTimeShort(days: number): string {
  return `Encomenda · ${daysLabel(days)}`;
}

/** "Sob encomenda: peça com 2 dias de antecedência". */
export function formatLeadTimeLong(days: number): string {
  return `Sob encomenda: peça com ${daysLabel(days)} de antecedência`;
}

/** Maior antecedência entre os itens: um bolo de 2 dias segura o pedido inteiro. */
export function maxLeadTimeDays(items: { leadTimeDays: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.leadTimeDays), 0);
}

/**
 * Janelas livres de um dia. Começam na abertura, de hora em hora, e precisam caber
 * inteiras antes do fechamento. Ficam de fora as que começam antes de agora + preparo,
 * e o dia todo se for antes do prazo de encomenda ou além do limite de agendamento.
 */
export function slotsForDay(
  rules: SchedulingRules,
  dayKey: string,
  now: Date,
  leadTimeDays: number,
): number[] {
  const today = toDayKey(now);
  if (dayKey < addDays(today, leadTimeDays)) return [];
  if (dayKey > addDays(today, rules.maxAdvanceDays)) return [];

  const hours = hoursOn(rules, dayKey);
  if (!hours) return [];

  const earliest = now.getTime() + rules.prepMinutes * 60 * 1000;
  const slots: number[] = [];
  for (let start = toMinutes(hours.open); start + SLOT_MINUTES <= toMinutes(hours.close); start += SLOT_MINUTES) {
    if (storeInstant(dayKey, start).getTime() >= earliest) slots.push(start);
  }
  return slots;
}

/** Os dias (de hoje até o limite de agendamento) que têm alguma janela livre. */
export function availableDays(
  rules: SchedulingRules,
  now: Date,
  leadTimeDays: number,
): AvailableDay[] {
  const today = toDayKey(now);
  const days: AvailableDay[] = [];
  for (let offset = 0; offset <= rules.maxAdvanceDays; offset++) {
    const dayKey = addDays(today, offset);
    const slots = slotsForDay(rules, dayKey, now, leadTimeDays);
    if (slots.length > 0) days.push({ dayKey, slots });
  }
  return days;
}

/** A conferência do servidor: o instante escolhido é exatamente o início de uma janela livre. */
export function isSlotAvailable(
  rules: SchedulingRules,
  scheduledFor: Date,
  now: Date,
  leadTimeDays: number,
): boolean {
  const dayKey = toDayKey(scheduledFor);
  const start = minutesOfDay(scheduledFor);
  if (storeInstant(dayKey, start).getTime() !== scheduledFor.getTime()) return false;
  return slotsForDay(rules, dayKey, now, leadTimeDays).includes(start);
}

/** "15h–16h". */
export function formatSlotRange(start: number): string {
  return `${formatTime(start)}–${formatTime(start + SLOT_MINUTES)}`;
}

const WEEKDAY_NAMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** "dd/mm" de uma chave YYYY-MM-DD. */
function shortDate(dayKey: string): string {
  const [, month, day] = dayKey.split("-");
  return `${day}/${month}`;
}

/** Rótulo do botão do dia: "Hoje", "Amanhã" ou "Sáb 10/10". */
export function dayChipLabel(dayKey: string, now: Date): { title: string; subtitle: string } {
  const relative = relativeDayLabel(dayKey, now);
  const weekday = WEEKDAY_NAMES[weekdayOf(dayKey)];
  if (relative === "hoje" || relative === "amanhã") {
    return { title: relative === "hoje" ? "Hoje" : "Amanhã", subtitle: shortDate(dayKey) };
  }
  return { title: weekday.charAt(0).toUpperCase() + weekday.slice(1), subtitle: shortDate(dayKey) };
}

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "sábado, 10 de outubro · 15h–16h" — para pedido, e-mail e painel. */
export function formatScheduledFor(scheduledFor: Date): string {
  const dayKey = toDayKey(scheduledFor);
  const date = longDateFormatter.format(new Date(`${dayKey}T12:00:00Z`));
  return `${date} · ${formatSlotRange(minutesOfDay(scheduledFor))}`;
}
