/** Só os dígitos do telefone, sem o +55 do Brasil (quando vier com DDI). */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
}

/**
 * Máscara enquanto digita: "(83) 99999-9999" (celular) ou "(83) 3333-4444" (fixo).
 * Vai formatando aos poucos, então apagar e colar também funcionam.
 */
export function formatPhoneInput(value: string): string {
  const digits = phoneDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  // Com 9 dígitos depois do DDD é celular (5+4); até 8, fixo (4+4).
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** DDD + 8 dígitos (fixo) ou DDD + 9 dígitos (celular). */
export function isValidPhone(value: string): boolean {
  const length = phoneDigits(value).length;
  return length === 10 || length === 11;
}
