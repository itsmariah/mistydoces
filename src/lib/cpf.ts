/** Valida CPF pelo algoritmo oficial de dígitos verificadores (não apenas o formato). */
export function isValidCpf(rawValue: string): boolean {
  const digits = rawValue.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const checkDigit = ((sum * 10) % 11) % 10;
    if (checkDigit !== Number(digits[length])) return false;
  }

  return true;
}
