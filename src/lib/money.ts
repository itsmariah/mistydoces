// Preços são manipulados em centavos (inteiros) durante cálculos para evitar
// erros de ponto flutuante; convertidos de volta para reais só ao persistir.
export function toCents(value: unknown): number {
  return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
