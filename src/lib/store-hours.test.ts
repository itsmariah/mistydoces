import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEEKLY_HOURS,
  describeOpenStatus,
  formatTime,
  formatWeeklyHours,
  getOpenStatus,
  hoursOn,
  parseBlockedDates,
  parseWeeklyHours,
  weeklyHoursSchema,
} from "@/lib/store-hours";

// 2026-10-05 é uma segunda-feira. Fuso da loja: UTC-3.
const at = (dayKey: string, time: string) => new Date(`${dayKey}T${time}:00-03:00`);
const schedule = { weeklyHours: DEFAULT_WEEKLY_HOURS, blockedDates: [] as string[] };

describe("parseWeeklyHours", () => {
  it("usa o padrão (seg a sáb, 13h às 21h) quando nunca foi configurado ou está inválido", () => {
    expect(parseWeeklyHours(null)).toEqual(DEFAULT_WEEKLY_HOURS);
    expect(parseWeeklyHours([{ day: 9, open: "x", close: "y" }])).toEqual(DEFAULT_WEEKLY_HOURS);
    expect(DEFAULT_WEEKLY_HOURS.map((item) => item.day)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("respeita uma semana configurada, inclusive vazia (loja fechada)", () => {
    expect(parseWeeklyHours([])).toEqual([]);
    expect(parseWeeklyHours([{ day: 3, open: "09:00", close: "12:00" }])).toEqual([
      { day: 3, open: "09:00", close: "12:00" },
    ]);
  });
});

describe("weeklyHoursSchema", () => {
  it("recusa fechamento antes da abertura e dia repetido", () => {
    expect(weeklyHoursSchema.safeParse([{ day: 1, open: "21:00", close: "13:00" }]).success).toBe(false);
    expect(
      weeklyHoursSchema.safeParse([
        { day: 1, open: "13:00", close: "21:00" },
        { day: 1, open: "08:00", close: "10:00" },
      ]).success,
    ).toBe(false);
  });
});

describe("parseBlockedDates", () => {
  it("ordena, tira repetidas e ignora formato inválido", () => {
    expect(parseBlockedDates(["2026-12-25", "2026-10-12", "2026-12-25"])).toEqual([
      "2026-10-12",
      "2026-12-25",
    ]);
    expect(parseBlockedDates("2026-12-25")).toEqual([]);
  });
});

describe("formatWeeklyHours", () => {
  it("junta dias seguidos com o mesmo horário e mostra os fechados", () => {
    expect(formatWeeklyHours(DEFAULT_WEEKLY_HOURS)).toEqual([
      "Seg a sáb · 13h às 21h",
      "Dom · fechado",
    ]);
  });

  it("separa horários diferentes e usa minutos quando há", () => {
    expect(
      formatWeeklyHours([
        { day: 1, open: "13:00", close: "21:00" },
        { day: 2, open: "13:00", close: "21:00" },
        { day: 6, open: "09:30", close: "13:00" },
        { day: 0, open: "09:30", close: "13:00" },
      ]),
    ).toEqual([
      "Seg e ter · 13h às 21h",
      "Qua a sex · fechado",
      "Sáb e dom · 9h30 às 13h",
    ]);
    expect(formatTime(90)).toBe("1h30");
  });
});

describe("getOpenStatus / describeOpenStatus", () => {
  it("aberto dentro do horário", () => {
    const now = at("2026-10-05", "15:00");
    const status = getOpenStatus(schedule, now);
    expect(status).toEqual({ isOpen: true, closesAt: "21:00" });
    expect(describeOpenStatus(status, now)).toBe("Aberto agora · até 21h");
  });

  it("antes de abrir, abre hoje; depois de fechar, abre amanhã", () => {
    const morning = at("2026-10-05", "10:00");
    expect(describeOpenStatus(getOpenStatus(schedule, morning), morning)).toBe(
      "Fechado · abre hoje às 13h",
    );
    const night = at("2026-10-05", "21:00");
    expect(describeOpenStatus(getOpenStatus(schedule, night), night)).toBe(
      "Fechado · abre amanhã às 13h",
    );
  });

  it("sábado à noite pula o domingo fechado", () => {
    const saturdayNight = at("2026-10-10", "22:00");
    expect(describeOpenStatus(getOpenStatus(schedule, saturdayNight), saturdayNight)).toBe(
      "Fechado · abre seg às 13h",
    );
  });

  it("data bloqueada conta como fechado", () => {
    const blocked = { ...schedule, blockedDates: ["2026-10-12"] };
    expect(hoursOn(blocked, "2026-10-12")).toBeNull();
    const now = at("2026-10-12", "15:00");
    expect(describeOpenStatus(getOpenStatus(blocked, now), now)).toBe(
      "Fechado · abre amanhã às 13h",
    );
  });

  it("sem nenhum dia de funcionamento, não inventa abertura", () => {
    const now = at("2026-10-05", "15:00");
    expect(describeOpenStatus(getOpenStatus({ weeklyHours: [], blockedDates: [] }, now), now)).toBe(
      "Fechado no momento",
    );
  });
});
