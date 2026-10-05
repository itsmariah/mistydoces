import { describe, expect, it } from "vitest";
import { DEFAULT_WEEKLY_HOURS } from "@/lib/store-hours";
import {
  normalizeInstagram,
  storeSettingsSchema,
  weeklyHoursToForm,
} from "@/validations/store-settings";

const blank = {
  storeName: "MistyDoces",
  description: "",
  whatsapp: "",
  phone: "",
  email: "",
  instagram: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  weeklyHours: weeklyHoursToForm(DEFAULT_WEEKLY_HOURS),
  hoursNote: "",
  prepMinutes: 60,
  maxAdvanceDays: 30,
  blockedDates: [] as string[],
  deliveryFee: 8,
};

describe("storeSettingsSchema", () => {
  it("campos opcionais vazios (ou só espaços) viram null", () => {
    const parsed = storeSettingsSchema.parse({ ...blank, description: "   " });
    expect(parsed).toMatchObject({
      description: null,
      whatsapp: null,
      email: null,
      instagram: null,
      state: null,
      hoursNote: null,
    });
  });

  it("aceita contato completo e normaliza UF e Instagram", () => {
    const parsed = storeSettingsSchema.parse({
      ...blank,
      whatsapp: "(83) 99999-9999",
      email: "contato@mistydoces.com.br",
      instagram: "https://www.instagram.com/mistydoces/",
      state: "pb",
      zipCode: "58000-000",
      hoursNote: "Feriados sob consulta",
    });
    expect(parsed).toMatchObject({
      instagram: "mistydoces",
      state: "PB",
      zipCode: "58000-000",
      hoursNote: "Feriados sob consulta",
    });
  });

  it("recusa WhatsApp que não vira link válido", () => {
    const result = storeSettingsSchema.safeParse({ ...blank, whatsapp: "9999" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["whatsapp"]);
  });

  it("recusa e-mail, UF, CEP e Instagram inválidos", () => {
    for (const [field, value] of [
      ["email", "contato@"],
      ["state", "Paraíba"],
      ["zipCode", "5800"],
      ["instagram", "misty doces!"],
    ]) {
      const result = storeSettingsSchema.safeParse({ ...blank, [field]: value });
      expect(result.success, field).toBe(false);
    }
  });
});

describe("horário e agendamento", () => {
  it("guarda só os dias ligados, com o número do dia", () => {
    const form = weeklyHoursToForm(DEFAULT_WEEKLY_HOURS);
    expect(form[0]).toEqual({ enabled: false, open: "13:00", close: "21:00" });
    const parsed = storeSettingsSchema.parse({ ...blank, weeklyHours: form });
    expect(parsed.weeklyHours).toEqual(DEFAULT_WEEKLY_HOURS);
  });

  it("aponta o erro no fechamento do dia que fecha antes de abrir", () => {
    const form = weeklyHoursToForm(DEFAULT_WEEKLY_HOURS);
    form[3] = { enabled: true, open: "21:00", close: "13:00" };
    const result = storeSettingsSchema.safeParse({ ...blank, weeklyHours: form });
    expect(result.error?.issues[0].path).toEqual(["weeklyHours", 3, "close"]);
  });

  it("ignora horário inválido de um dia desligado", () => {
    const form = weeklyHoursToForm(DEFAULT_WEEKLY_HOURS);
    form[0] = { enabled: false, open: "", close: "" };
    expect(storeSettingsSchema.safeParse({ ...blank, weeklyHours: form }).success).toBe(true);
  });

  it("ordena e tira datas bloqueadas repetidas; recusa formato inválido", () => {
    const parsed = storeSettingsSchema.parse({
      ...blank,
      blockedDates: ["2026-12-25", "2026-10-12", "2026-12-25"],
    });
    expect(parsed.blockedDates).toEqual(["2026-10-12", "2026-12-25"]);
    expect(storeSettingsSchema.safeParse({ ...blank, blockedDates: ["25/12"] }).success).toBe(false);
  });
});

describe("normalizeInstagram", () => {
  it("aceita @usuario, usuario ou link do perfil", () => {
    expect(normalizeInstagram("@mistydoces")).toBe("mistydoces");
    expect(normalizeInstagram("mistydoces")).toBe("mistydoces");
    expect(normalizeInstagram("instagram.com/mistydoces?igsh=abc")).toBe("mistydoces");
    expect(normalizeInstagram(" https://instagram.com/misty.doces/ ")).toBe("misty.doces");
  });
});
