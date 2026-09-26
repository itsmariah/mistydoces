import { describe, expect, it } from "vitest";
import { whatsappUrl } from "@/lib/whatsapp";

describe("whatsappUrl", () => {
  it("adiciona o 55 a um celular com DDD, ignorando a formatação", () => {
    expect(whatsappUrl("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
  });

  it("aceita fixo com DDD", () => {
    expect(whatsappUrl("11 3456-7890")).toBe("https://wa.me/551134567890");
  });

  it("mantém o número que já vem com 55", () => {
    expect(whatsappUrl("+55 11 98765-4321")).toBe("https://wa.me/5511987654321");
  });

  it("descarta o zero de discagem interurbana", () => {
    expect(whatsappUrl("011 98765-4321")).toBe("https://wa.me/5511987654321");
  });

  it("recusa números sem DDD ou incompletos", () => {
    expect(whatsappUrl("98765-4321")).toBeNull();
    expect(whatsappUrl("abc")).toBeNull();
  });

  it("codifica a mensagem", () => {
    expect(whatsappUrl("11987654321", "Olá, pedido #12")).toBe(
      "https://wa.me/5511987654321?text=Ol%C3%A1%2C%20pedido%20%2312",
    );
  });
});
