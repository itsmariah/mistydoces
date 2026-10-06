/**
 * Datas e horas no fuso da loja. O servidor roda em UTC e o cliente pode estar em outro
 * fuso, mas "hoje", "abre às 13h" e a janela agendada são sempre o relógio da cozinha.
 * Sem Prisma: o client usa as mesmas funções (status "Aberto agora", checkout).
 */
export const STORE_TIME_ZONE = "America/Sao_Paulo";

const DAY_MS = 24 * 60 * 60 * 1000;

// en-CA formata como YYYY-MM-DD, que serve de chave e ordena como texto.
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: STORE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STORE_TIME_ZONE,
  timeZoneName: "longOffset",
});

/** Dia (YYYY-MM-DD) em que o instante cai no fuso da loja. */
export function toDayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

/** Minutos desde a meia-noite, no relógio da loja (13:30 → 810). */
export function minutesOfDay(date: Date): number {
  const [hours, minutes] = clockFormatter.format(date).split(":").map(Number);
  return hours * 60 + minutes;
}

/** Dia da semana de uma chave YYYY-MM-DD (0 = domingo). */
export function weekdayOf(dayKey: string): number {
  return new Date(`${dayKey}T12:00:00Z`).getUTCDay();
}

/** Soma dias a uma chave YYYY-MM-DD (o calendário não depende de fuso). */
export function addDays(dayKey: string, days: number): string {
  return new Date(new Date(`${dayKey}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function timeZoneOffsetMinutes(date: Date): number {
  const name = offsetFormatter.formatToParts(date).find((part) => part.type === "timeZoneName");
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name?.value ?? "");
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** Instante (UTC) da meia-noite desse dia no fuso da loja. */
export function startOfDayInStoreTime(dayKey: string): Date {
  const utcMidnight = new Date(`${dayKey}T00:00:00Z`);
  return new Date(utcMidnight.getTime() - timeZoneOffsetMinutes(utcMidnight) * 60 * 1000);
}

/** Instante (UTC) de "dia X, às N minutos" no relógio da loja. */
export function storeInstant(dayKey: string, minutes: number): Date {
  return new Date(startOfDayInStoreTime(dayKey).getTime() + minutes * 60 * 1000);
}

/** "Bom dia" até meio-dia, "Boa tarde" até 18h, "Boa noite" depois — no relógio da loja. */
export function greetingFor(date: Date): string {
  const minutes = minutesOfDay(date);
  if (minutes < 12 * 60) return "Bom dia";
  if (minutes < 18 * 60) return "Boa tarde";
  return "Boa noite";
}
