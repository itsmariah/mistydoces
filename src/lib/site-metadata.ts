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
  // Sem `images`: a prévia vem dos arquivos `opengraph-image.tsx` (o do app inteiro e o do
  // produto), que o Next coloca nas tags sozinho e têm prioridade sobre o que for definido aqui.
} satisfies Metadata["openGraph"];
