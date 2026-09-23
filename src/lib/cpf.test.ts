import { describe, expect, it } from "vitest";
import { isValidCpf } from "@/lib/cpf";

describe("isValidCpf", () => {
  it("aceita um CPF válido, com ou sem máscara", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });

  it("rejeita dígitos verificadores incorretos", () => {
    expect(isValidCpf("111.444.777-36")).toBe(false);
  });

  it("rejeita sequências com todos os dígitos iguais", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("rejeita valores com tamanho incorreto", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});
