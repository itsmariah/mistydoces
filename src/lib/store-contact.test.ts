import { describe, expect, it } from "vitest";
import { buildStoreContact, DEFAULT_STORE_NAME } from "@/lib/store-contact";

const settings = {
  storeName: "MistyDoces",
  description: null,
  whatsapp: null,
  phone: null,
  email: null,
  instagram: null,
  street: null,
  city: null,
  state: null,
  zipCode: null,
  hoursNote: null,
  weeklyHours: null,
  blockedDates: [],
};

describe("buildStoreContact", () => {
  it("sem configurações salvas, usa o nome padrão e nenhum canal", () => {
    expect(buildStoreContact(null)).toMatchObject({
      storeName: DEFAULT_STORE_NAME,
      hasChannels: false,
      pickup: null,
    });
  });

  it("monta os links de WhatsApp (com mensagem), telefone, e-mail e Instagram", () => {
    const contact = buildStoreContact({
      ...settings,
      whatsapp: "(83) 99999-9999",
      phone: "(83) 3333-3333",
      email: "oi@misty.com",
      instagram: "mistydoces",
    });

    expect(contact.whatsappHref).toBe(
      `https://wa.me/5583999999999?text=${encodeURIComponent("Olá! Vim pelo site da MistyDoces.")}`,
    );
    expect(contact.phone).toEqual({ display: "(83) 3333-3333", href: "tel:+558333333333" });
    expect(contact.email?.href).toBe("mailto:oi@misty.com");
    expect(contact.instagram?.href).toBe("https://instagram.com/mistydoces");
    expect(contact.hasChannels).toBe(true);
  });

  it("retirada só existe com endereço, e junta cidade/UF e CEP", () => {
    expect(buildStoreContact({ ...settings, city: "João Pessoa" }).pickup).toBeNull();

    const { pickup } = buildStoreContact({
      ...settings,
      street: "Rua das Flores, 123",
      city: "João Pessoa",
      state: "PB",
      zipCode: "58000-000",
      hoursNote: "Feriados sob consulta",
      weeklyHours: [{ day: 2, open: "09:00", close: "18:00" }],
    });
    expect(pickup?.addressLines).toEqual([
      "Rua das Flores, 123",
      "João Pessoa/PB — CEP 58000-000",
    ]);
    expect(pickup?.mapsHref).toContain(encodeURIComponent("Rua das Flores, 123, João Pessoa, PB"));
    expect(pickup?.hours.note).toBe("Feriados sob consulta");
    expect(pickup?.hours.lines[0]).toBe("Seg · fechado");
    expect(pickup?.hours.lines).toContain("Ter · 9h às 18h");
  });

  it("sem horário configurado, usa o padrão de seg a sáb", () => {
    expect(buildStoreContact(settings).hours.lines).toEqual([
      "Seg a sáb · 13h às 21h",
      "Dom · fechado",
    ]);
    expect(buildStoreContact(null).schedule.weeklyHours).toHaveLength(6);
  });
});
