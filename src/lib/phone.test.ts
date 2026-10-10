import { describe, expect, it } from "vitest";
import { formatPhoneInput, isValidPhone, phoneDigits } from "@/lib/phone";

describe("formatPhoneInput", () => {
  it("formata celular completo", () => {
    expect(formatPhoneInput("83999998888")).toBe("(83) 99999-8888");
  });

  it("formata fixo completo", () => {
    expect(formatPhoneInput("8333334444")).toBe("(83) 3333-4444");
  });

  it("vai formatando aos poucos", () => {
    expect(formatPhoneInput("8")).toBe("(8");
    expect(formatPhoneInput("83")).toBe("(83");
    expect(formatPhoneInput("839")).toBe("(83) 9");
    expect(formatPhoneInput("839999")).toBe("(83) 9999");
    expect(formatPhoneInput("8399999")).toBe("(83) 9999-9");
  });

  it("aceita texto já formatado ou colado com +55", () => {
    expect(formatPhoneInput("(83) 99999-8888")).toBe("(83) 99999-8888");
    expect(formatPhoneInput("+55 83 99999-8888")).toBe("(83) 99999-8888");
  });

  it("corta dígitos a mais", () => {
    expect(formatPhoneInput("839999988881234")).toBe("(83) 99999-8888");
  });

  it("vazio continua vazio (dá para apagar tudo)", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("(")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("aceita fixo e celular com DDD", () => {
    expect(isValidPhone("(83) 3333-4444")).toBe(true);
    expect(isValidPhone("(83) 99999-8888")).toBe(true);
    expect(isValidPhone("+55 83 99999-8888")).toBe(true);
  });

  it("recusa sem DDD ou incompleto", () => {
    expect(isValidPhone("99999-8888")).toBe(false);
    expect(isValidPhone("(83) 9999")).toBe(false);
  });
});

describe("phoneDigits", () => {
  it("tira o 55 só quando é DDI", () => {
    expect(phoneDigits("+55 83 99999-8888")).toBe("83999998888");
    // DDD 55 (RS) sem DDI: tem 11 dígitos, fica como está.
    expect(phoneDigits("(55) 99999-8888")).toBe("55999998888");
  });
});
