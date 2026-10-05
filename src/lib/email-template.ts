import { SITE_URL } from "@/lib/site-metadata";

// Cores fixas do tema claro (globals.css): e-mail não lê variáveis CSS nem segue o tema do site.
const COLORS = {
  page: "#fbf3ea",
  card: "#ffffff",
  band: "#efe6f5",
  text: "#3d3242",
  muted: "#6f6475",
  link: "#3f6ba8",
  border: "#eadfd3",
};

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Tudo que vem do usuário (nome, produto) passa por aqui antes de entrar no HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function assetUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export type EmailLine = { label: string; value: string; strong?: boolean };

export type EmailContent = {
  /** Texto curto que aparece ao lado do assunto na caixa de entrada. */
  preheader: string;
  title: string;
  /** Parágrafos em texto puro — escapados aqui. */
  paragraphs: string[];
  /** Tabelinha de itens/valores (ex.: itens do pedido e total). */
  lines?: EmailLine[];
  cta?: { label: string; href: string };
  /** Link de WhatsApp da loja, quando preenchido no painel. */
  whatsappHref?: string | null;
};

function renderLines(lines: EmailLine[]): string {
  const rows = lines
    .map(
      (line) => `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:${COLORS.text};${line.strong ? "font-weight:bold;border-top:1px solid " + COLORS.border + ";padding-top:10px;" : ""}">${escapeHtml(line.label)}</td>
          <td align="right" style="padding:6px 0;font-size:14px;white-space:nowrap;color:${line.strong ? COLORS.link : COLORS.text};${line.strong ? "font-weight:bold;border-top:1px solid " + COLORS.border + ";padding-top:10px;" : ""}">${escapeHtml(line.value)}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">${rows}</table>`;
}

/**
 * Layout de marca dos e-mails transacionais: faixa lilás com o logo, cartão branco com o
 * conteúdo e rodapé "Feito com carinho". HTML em tabelas e estilos inline, que é o que os
 * clientes de e-mail (Gmail, Outlook) realmente respeitam.
 */
export function renderEmail(content: EmailContent): { html: string; text: string } {
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const cta = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:999px;background:${COLORS.link};">
        <a href="${escapeHtml(content.cta.href)}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(content.cta.label)}</a>
      </td></tr></table>`
    : "";

  const whatsapp = content.whatsappHref
    ? `<p style="margin:0 0 8px;">Dúvidas? <a href="${escapeHtml(content.whatsappHref)}" style="color:${COLORS.link};">Fale com a gente no WhatsApp</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(content.title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="background:${COLORS.band};border-radius:20px 20px 0 0;padding:24px 16px 16px;">
          <a href="${assetUrl("/")}"><img src="${assetUrl("/branding/25_mini_logo_misty_doces.png")}" width="112" height="105" alt="MistyDoces" style="display:block;border:0;"></a>
        </td></tr>
        <tr><td style="background:${COLORS.card};border-radius:0 0 20px 20px;padding:28px 28px 32px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${COLORS.text};">${escapeHtml(content.title)}</h1>
          ${paragraphs}
          ${content.lines?.length ? renderLines(content.lines) : ""}
          ${cta}
        </td></tr>
        <tr><td align="center" style="padding:20px 16px;font-size:12px;line-height:1.6;color:${COLORS.muted};">
          ${whatsapp}
          <p style="margin:0;"><img src="${assetUrl("/branding/10_coracao_patinha.png")}" width="16" height="16" alt="" style="vertical-align:middle;border:0;"> Feito com carinho pela <a href="${assetUrl("/")}" style="color:${COLORS.link};">MistyDoces</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Versão em texto puro: melhora a entrega e é o que leitores sem HTML mostram.
  const text = [
    content.title,
    "",
    ...content.paragraphs,
    ...(content.lines?.length
      ? ["", ...content.lines.map((line) => `${line.label}: ${line.value}`)]
      : []),
    ...(content.cta ? ["", `${content.cta.label}: ${content.cta.href}`] : []),
    ...(content.whatsappHref ? ["", `Dúvidas? WhatsApp: ${content.whatsappHref}`] : []),
    "",
    "Feito com carinho pela MistyDoces",
  ].join("\n");

  return { html, text };
}
