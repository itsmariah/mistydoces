import type { Metadata } from "next";

/** URL pública do site — a mesma usada nos links dos e-mails e no webhook do Mercado Pago. */
export const SITE_URL = new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000");

export const SITE_NAME = "MistyDoces";

/**
 * Campos de Open Graph comuns a todas as páginas. Metadados de segmentos diferentes
 * são mesclados de forma rasa — uma página que define `openGraph` substitui o objeto
 * inteiro do layout, então ela precisa espalhar esta base para não perder siteName/locale.
 */
export const BASE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "pt_BR",
  type: "website",
  images: [{ url: "/branding/01_logo_misty_doces.png", width: 210, height: 235, alt: SITE_NAME }],
} satisfies Metadata["openGraph"];
