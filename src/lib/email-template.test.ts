import { describe, expect, it } from "vitest";
import { escapeHtml, renderEmail } from "@/lib/email-template";

describe("escapeHtml", () => {
  it("escapa os caracteres que abririam HTML", () => {
    expect(escapeHtml(`<script>"oi" & 'tchau'</script>`)).toBe(
      "&lt;script&gt;&quot;oi&quot; &amp; &#39;tchau&#39;&lt;/script&gt;",
    );
  });
});

describe("renderEmail", () => {
  const content = {
    preheader: "Prévia",
    title: "Recebemos seu pedido!",
    paragraphs: ["Olá, <Ana>!"],
    lines: [{ label: "Total", value: "R$ 10,00", strong: true }],
    cta: { label: "Ver pedido", href: "https://loja.test/conta/pedidos/1" },
  };

  it("escapa o texto e usa URLs absolutas para as imagens", () => {
    const { html } = renderEmail(content);
    expect(html).toContain("Olá, &lt;Ana&gt;!");
    expect(html).toMatch(/src="https?:\/\/[^"]+\/branding\/25_mini_logo_misty_doces\.png"/);
    expect(html).toContain('href="https://loja.test/conta/pedidos/1"');
  });

  it("só mostra o WhatsApp quando a loja tem um", () => {
    expect(renderEmail(content).html).not.toContain("WhatsApp");
    expect(renderEmail({ ...content, whatsappHref: "https://wa.me/55" }).html).toContain(
      "Fale com a gente no WhatsApp",
    );
  });

  it("gera uma versão em texto puro com o link do botão", () => {
    const { text } = renderEmail(content);
    expect(text).toContain("Recebemos seu pedido!");
    expect(text).toContain("Total: R$ 10,00");
    expect(text).toContain("Ver pedido: https://loja.test/conta/pedidos/1");
  });
});
