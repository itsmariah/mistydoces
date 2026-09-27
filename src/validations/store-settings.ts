import { z } from "zod";
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
  openingHours: optionalText(300),
  deliveryFee: z.number().min(0, "A taxa não pode ser negativa."),
});

/** O que o formulário manipula (tudo texto, vazio = não informado). */
export type StoreSettingsFormValues = z.input<typeof storeSettingsSchema>;
/** O que vai para o banco (opcionais vazios já como `null`). */
export type StoreSettingsInput = z.output<typeof storeSettingsSchema>;
