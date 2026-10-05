import { z } from "zod";
import { blockedDatesSchema, dayHoursSchema, type WeeklyHours } from "@/lib/store-hours";
import { whatsappUrl } from "@/lib/whatsapp";

/** Usuário do Instagram: letras, números, ponto e sublinhado, até 30 caracteres. */
const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;

/** Aceita "@misty", "misty" ou o link do perfil — guarda só o usuário. */
export function normalizeInstagram(value: string): string {
  return value
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

/**
 * Campo opcional de texto: vazio vira `null` (nunca string em branco no banco) e
 * `check` só roda quando há algo digitado.
 */
function optionalText(
  max: number,
  check?: { test: (value: string) => boolean; message: string },
) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .refine((value) => value === "" || !check || check.test(value), check?.message)
    .transform((value) => (value === "" ? null : value));
}

/**
 * No formulário, a semana é sempre 7 linhas (índice = dia, 0 = domingo) com liga/desliga;
 * no banco, só os dias abertos. O horário de um dia desligado fica guardado no form,
 * para não sumir se a pessoa religar o dia.
 */
const weekDayFormSchema = z.object({ enabled: z.boolean(), open: z.string(), close: z.string() });

const weeklyHoursFormSchema = z
  .array(weekDayFormSchema)
  .length(7)
  .superRefine((days, ctx) => {
    days.forEach((item, day) => {
      if (!item.enabled) return;
      const parsed = dayHoursSchema.safeParse({ day, open: item.open, close: item.close });
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", path: [day, "close"], message: parsed.error.issues[0].message });
      }
    });
  })
  .transform((days): WeeklyHours =>
    days.flatMap((item, day) => (item.enabled ? [{ day, open: item.open, close: item.close }] : [])),
  );

const DEFAULT_FORM_DAY = { open: "13:00", close: "21:00" };

/** Do banco para as 7 linhas do formulário. */
export function weeklyHoursToForm(hours: WeeklyHours): z.input<typeof weeklyHoursFormSchema> {
  return Array.from({ length: 7 }, (_, day) => {
    const item = hours.find((entry) => entry.day === day);
    return item
      ? { enabled: true, open: item.open, close: item.close }
      : { enabled: false, ...DEFAULT_FORM_DAY };
  });
}

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Informe o nome da loja.").max(60),
  description: optionalText(200),
  whatsapp: optionalText(20, {
    test: (value) => whatsappUrl(value) !== null,
    message: "Informe o número com DDD (ex.: (83) 99999-9999).",
  }),
  phone: optionalText(20),
  email: optionalText(120, {
    test: (value) => z.email().safeParse(value).success,
    message: "Informe um e-mail válido.",
  }),
  instagram: z
    .string()
    .transform(normalizeInstagram)
    .refine((value) => value === "" || INSTAGRAM_HANDLE.test(value), "Informe um usuário válido (ex.: @mistydoces).")
    .transform((value) => (value === "" ? null : value)),
  street: optionalText(120),
  city: optionalText(60),
  state: optionalText(2, {
    test: (value) => /^[A-Za-z]{2}$/.test(value),
    message: "Use a sigla do estado (ex.: PB).",
  }).transform((value) => value?.toUpperCase() ?? null),
  zipCode: optionalText(9, {
    test: (value) => /^\d{5}-?\d{3}$/.test(value),
    message: "Informe um CEP válido (ex.: 58000-000).",
  }),
  weeklyHours: weeklyHoursFormSchema,
  hoursNote: optionalText(200),
  prepMinutes: z
    .number({ error: "Informe o tempo de preparo." })
    .int("Use minutos inteiros.")
    .min(0, "O tempo não pode ser negativo.")
    .max(24 * 60, "Use no máximo 1440 minutos (24h)."),
  maxAdvanceDays: z
    .number({ error: "Informe quantos dias." })
    .int("Use dias inteiros.")
    .min(1, "Permita agendar pelo menos 1 dia à frente.")
    .max(180, "Use no máximo 180 dias."),
  blockedDates: blockedDatesSchema.transform((dates) => [...new Set(dates)].sort()),
  deliveryFee: z.number().min(0, "A taxa não pode ser negativa."),
});

/** O que o formulário manipula (tudo texto, vazio = não informado). */
export type StoreSettingsFormValues = z.input<typeof storeSettingsSchema>;
/** O que vai para o banco (opcionais vazios já como `null`). */
export type StoreSettingsInput = z.output<typeof storeSettingsSchema>;
