import { describe, expect, it } from "vitest";
import {
  availableDays,
  dayChipLabel,
  formatScheduledFor,
  formatSlotRange,
  isSlotAvailable,
  maxLeadTimeDays,
  slotsForDay,
  type SchedulingRules,
} from "@/lib/scheduling";
import { DEFAULT_WEEKLY_HOURS } from "@/lib/store-hours";

// 2026-10-05 é uma segunda-feira. Fuso da loja: UTC-3.
const at = (dayKey: string, time: string) => new Date(`${dayKey}T${time}:00-03:00`);
const rules: SchedulingRules = {
  weeklyHours: DEFAULT_WEEKLY_HOURS, // seg a sáb, 13h às 21h
  blockedDates: [],
  prepMinutes: 60,
  maxAdvanceDays: 30,
};
const h = (hours: number) => hours * 60;

describe("maxLeadTimeDays", () => {
  it("vale o maior prazo do carrinho", () => {
    expect(maxLeadTimeDays([])).toBe(0);
    expect(maxLeadTimeDays([{ leadTimeDays: 0 }, { leadTimeDays: 2 }, { leadTimeDays: 1 }])).toBe(2);
  });
});

describe("slotsForDay", () => {
  it("janelas de hora em hora que cabem inteiras antes de fechar", () => {
    const morning = at("2026-10-05", "08:00");
    expect(slotsForDay(rules, "2026-10-05", morning, 0)).toEqual(
      [13, 14, 15, 16, 17, 18, 19, 20].map(h),
    );
  });

  it("respeita o tempo de preparo a partir de agora", () => {
    const now = at("2026-10-05", "15:10");
    // 15:10 + 60 min = 16:10 → a primeira janela inteira livre é 17h.
    expect(slotsForDay(rules, "2026-10-05", now, 0)).toEqual([17, 18, 19, 20].map(h));
  });

  it("dia fechado, bloqueado, antes do prazo de encomenda ou além do limite não tem janela", () => {
    const now = at("2026-10-05", "08:00");
    expect(slotsForDay(rules, "2026-10-11", now, 0)).toEqual([]); // domingo
    expect(slotsForDay({ ...rules, blockedDates: ["2026-10-06"] }, "2026-10-06", now, 0)).toEqual([]);
    expect(slotsForDay(rules, "2026-10-06", now, 2)).toEqual([]);
    expect(slotsForDay(rules, "2026-10-07", now, 2)).toHaveLength(8);
    expect(slotsForDay({ ...rules, maxAdvanceDays: 1 }, "2026-10-07", now, 0)).toEqual([]);
  });
});

describe("availableDays", () => {
  it("pedido no sábado à noite começa na segunda (pula o domingo)", () => {
    const days = availableDays(rules, at("2026-10-10", "22:00"), 0);
    expect(days[0].dayKey).toBe("2026-10-12");
    expect(days[0].slots[0]).toBe(h(13));
  });

  it("só lista dias com alguma janela", () => {
    const days = availableDays({ ...rules, maxAdvanceDays: 7 }, at("2026-10-05", "20:30"), 0);
    expect(days.map((day) => day.dayKey)).toEqual([
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-12",
    ]);
  });
});

describe("isSlotAvailable", () => {
  const now = at("2026-10-05", "15:10");

  it("aceita o início exato de uma janela livre", () => {
    expect(isSlotAvailable(rules, at("2026-10-05", "17:00"), now, 0)).toBe(true);
  });

  it("recusa janela que já passou, fora do horário, desalinhada ou antes do prazo", () => {
    expect(isSlotAvailable(rules, at("2026-10-05", "16:00"), now, 0)).toBe(false);
    expect(isSlotAvailable(rules, at("2026-10-05", "21:00"), now, 0)).toBe(false);
    expect(isSlotAvailable(rules, at("2026-10-05", "17:30"), now, 0)).toBe(false);
    expect(isSlotAvailable(rules, at("2026-10-06", "17:00"), now, 2)).toBe(false);
  });
});

describe("rótulos", () => {
  const now = at("2026-10-05", "10:00");

  it("botões de dia e faixa da janela", () => {
    expect(dayChipLabel("2026-10-05", now)).toEqual({ title: "Hoje", subtitle: "05/10" });
    expect(dayChipLabel("2026-10-06", now)).toEqual({ title: "Amanhã", subtitle: "06/10" });
    expect(dayChipLabel("2026-10-10", now)).toEqual({ title: "Sáb", subtitle: "10/10" });
    expect(formatSlotRange(h(15))).toBe("15h–16h");
  });

  it("data completa no fuso da loja", () => {
    expect(formatScheduledFor(at("2026-10-10", "15:00"))).toBe("sábado, 10 de outubro · 15h–16h");
  });
});
