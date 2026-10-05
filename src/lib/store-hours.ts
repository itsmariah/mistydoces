import { z } from "zod";
import { addDays, minutesOfDay, toDayKey, weekdayOf } from "@/lib/store-time";

/** Um dia de funcionamento. `day`: 0 = domingo … 6 = sábado; horas "HH:MM" no fuso da loja. */
export type DayHours = { day: number; open: string; close: string };
export type WeeklyHours = DayHours[];

/** Horário semanal + datas bloqueadas: tudo o que decide se a loja está aberta num dia. */
export type StoreSchedule = { weeklyHours: WeeklyHours; blockedDates: string[] };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "13:30" → 810. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const dayHoursSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    open: z.string().regex(TIME_PATTERN, "Use o formato 13:00."),
    close: z.string().regex(TIME_PATTERN, "Use o formato 21:00."),
  })
  // Sem virar a meia-noite: fechar 02:00 seria outro dia, e a loja não funciona assim.
  .refine((hours) => toMinutes(hours.close) > toMinutes(hours.open), {
    message: "O fechamento precisa ser depois da abertura.",
    path: ["close"],
  });

export const weeklyHoursSchema = z
  .array(dayHoursSchema)
  .max(7)
  .refine((days) => new Set(days.map((item) => item.day)).size === days.length, {
    message: "Cada dia da semana aparece uma vez só.",
  });

export const blockedDatesSchema = z.array(z.string().regex(DAY_KEY_PATTERN)).max(100);

/** Padrão enquanto a loja não configurou: segunda a sábado, 13h às 21h; domingo fechado. */
export const DEFAULT_WEEKLY_HOURS: WeeklyHours = [1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "13:00",
  close: "21:00",
}));

/** Lê o JSON do banco. `null` (nunca configurado) ou formato inválido → horário padrão. */
export function parseWeeklyHours(value: unknown): WeeklyHours {
  if (value === null || value === undefined) return DEFAULT_WEEKLY_HOURS;
  const parsed = weeklyHoursSchema.safeParse(value);
  if (!parsed.success) return DEFAULT_WEEKLY_HOURS;
  return [...parsed.data].sort((a, b) => a.day - b.day);
}

export function parseBlockedDates(value: unknown): string[] {
  const parsed = blockedDatesSchema.safeParse(value);
  return parsed.success ? [...new Set(parsed.data)].sort() : [];
}

/** 780 ou "13:00" → "13h"; "13:30" → "13h30". */
export function formatTime(time: number | string): string {
  const total = typeof time === "number" ? time : toMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}`;
}

const SHORT_DAY_NAMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
// A semana da loja começa na segunda: "Seg a sáb" lê melhor que "Dom, seg a sáb".
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function groupLabel(days: number[]): string {
  const names = days.map((day) => SHORT_DAY_NAMES[day]);
  if (names.length === 1) return capitalize(names[0]);
  if (names.length === 2) return capitalize(`${names[0]} e ${names[1]}`);
  return capitalize(`${names[0]} a ${names[names.length - 1]}`);
}

/**
 * Horário em linhas curtas, juntando dias seguidos com o mesmo horário:
 * ["Seg a sáb · 13h às 21h", "Dom · fechado"].
 */
export function formatWeeklyHours(hours: WeeklyHours): string[] {
  const byDay = new Map(hours.map((item) => [item.day, item]));
  const groups: { days: number[]; text: string }[] = [];

  for (const day of WEEK_ORDER) {
    const item = byDay.get(day);
    const text = item ? `${formatTime(item.open)} às ${formatTime(item.close)}` : "fechado";
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(day);
    else groups.push({ days: [day], text });
  }

  return groups.map((group) => `${groupLabel(group.days)} · ${group.text}`);
}

/** Horário daquele dia (YYYY-MM-DD), ou `null` se a loja não abre (dia fechado ou bloqueado). */
export function hoursOn(schedule: StoreSchedule, dayKey: string): DayHours | null {
  if (schedule.blockedDates.includes(dayKey)) return null;
  return schedule.weeklyHours.find((item) => item.day === weekdayOf(dayKey)) ?? null;
}

/** Quantos dias à frente procurar a próxima abertura (cobre férias curtas). */
const NEXT_OPENING_SEARCH_DAYS = 30;

export type OpenStatus =
  | { isOpen: true; closesAt: string }
  | { isOpen: false; nextOpening: { dayKey: string; time: string } | null };

export function getOpenStatus(schedule: StoreSchedule, now: Date): OpenStatus {
  const today = toDayKey(now);
  const current = minutesOfDay(now);
  const todayHours = hoursOn(schedule, today);

  if (todayHours) {
    if (current >= toMinutes(todayHours.open) && current < toMinutes(todayHours.close)) {
      return { isOpen: true, closesAt: todayHours.close };
    }
    if (current < toMinutes(todayHours.open)) {
      return { isOpen: false, nextOpening: { dayKey: today, time: todayHours.open } };
    }
  }

  for (let offset = 1; offset <= NEXT_OPENING_SEARCH_DAYS; offset++) {
    const dayKey = addDays(today, offset);
    const hours = hoursOn(schedule, dayKey);
    if (hours) return { isOpen: false, nextOpening: { dayKey, time: hours.open } };
  }
  return { isOpen: false, nextOpening: null };
}

/** "hoje", "amanhã", "sáb" (até 6 dias) ou "12/10". */
export function relativeDayLabel(dayKey: string, now: Date): string {
  const today = toDayKey(now);
  if (dayKey === today) return "hoje";
  if (dayKey === addDays(today, 1)) return "amanhã";
  for (let offset = 2; offset <= 6; offset++) {
    if (dayKey === addDays(today, offset)) return SHORT_DAY_NAMES[weekdayOf(dayKey)];
  }
  const [, month, day] = dayKey.split("-");
  return `${day}/${month}`;
}

/** "Aberto agora · até 21h" ou "Fechado · abre amanhã às 13h". */
export function describeOpenStatus(status: OpenStatus, now: Date): string {
  if (status.isOpen) return `Aberto agora · até ${formatTime(status.closesAt)}`;
  if (!status.nextOpening) return "Fechado no momento";
  const day = relativeDayLabel(status.nextOpening.dayKey, now);
  // "abre 12/10 às 13h" soa estranho; com data, fica "abre dia 12/10".
  const prefix = day.includes("/") ? `dia ${day}` : day;
  return `Fechado · abre ${prefix} às ${formatTime(status.nextOpening.time)}`;
}
