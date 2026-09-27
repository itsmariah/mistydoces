import { describe, expect, it } from "vitest";
import { normalizeInstagram, storeSettingsSchema } from "@/validations/store-settings";

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
  openingHours: "",
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
      openingHours: null,
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
      openingHours: "Ter a sex: 9h às 18h\nSáb: 9h às 13h",
    });
    expect(parsed).toMatchObject({ instagram: "mistydoces", state: "PB", zipCode: "58000-000" });
    expect(parsed.openingHours).toContain("\n");
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

describe("normalizeInstagram", () => {
  it("aceita @usuario, usuario ou link do perfil", () => {
    expect(normalizeInstagram("@mistydoces")).toBe("mistydoces");
    expect(normalizeInstagram("mistydoces")).toBe("mistydoces");
    expect(normalizeInstagram("instagram.com/mistydoces?igsh=abc")).toBe("mistydoces");
    expect(normalizeInstagram(" https://instagram.com/misty.doces/ ")).toBe("misty.doces");
  });
});
