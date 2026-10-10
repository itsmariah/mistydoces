import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

/**
 * Peças comuns das imagens de compartilhamento (`opengraph-image.tsx`) — a prévia que aparece
 * quando alguém manda um link da loja no WhatsApp ou no Instagram.
 *
 * O `ImageResponse` desenha com o Satori, que não lê as fontes do `next/font`: os arquivos
 * .woff ficam em `src/assets/fonts` (Quicksand e Caveat, licença OFL, via @fontsource).
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Cores do tema claro (globals.css): a prévia não sabe se quem recebe usa modo escuro. */
export const OG_COLORS = {
  background: "#fbf3ea",
  foreground: "#3d3242",
  muted: "#756a78",
  link: "#3f6ba8",
  secondary: "#efe6f5",
  secondaryForeground: "#5f4a78",
  border: "#dfcdb2",
};

function readAsset(...path: string[]) {
  return readFile(join(process.cwd(), ...path));
}

let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 500 | 700; style: "normal" }[]
> | null = null;

export function loadOgFonts() {
  fontsPromise ??= Promise.all([
    readAsset("src/assets/fonts/quicksand-latin-500-normal.woff"),
    readAsset("src/assets/fonts/quicksand-latin-700-normal.woff"),
    readAsset("src/assets/fonts/caveat-latin-700-normal.woff"),
  ]).then(([quicksand500, quicksand700, caveat700]) => [
    { name: "Quicksand", data: quicksand500, weight: 500, style: "normal" },
    { name: "Quicksand", data: quicksand700, weight: 700, style: "normal" },
    { name: "Caveat", data: caveat700, weight: 700, style: "normal" },
  ]);
  return fontsPromise;
}

/** Ilustração de `public/` como data URL (`/branding/…png`): o Satori não lê caminhos locais. */
export async function publicImageDataUrl(publicPath: string): Promise<string> {
  const data = await readAsset("public", publicPath);
  return `data:image/png;base64,${data.toString("base64")}`;
}

/**
 * Foto do Cloudinary já recortada no quadrado e em JPEG: o Satori não decodifica WebP/AVIF,
 * e a original pode ter vários megas. Fora do Cloudinary, usa a URL como veio.
 */
export function ogPhotoUrl(url: string, size: number): string {
  return url.replace("/image/upload/", `/image/upload/c_fill,w_${size},h_${size},f_jpg/`);
}

/** Rodapé com o mini logo e o nome da loja, repetido nas duas prévias. */
export function OgBrand({ logoSrc, host }: { logoSrc: string; host: string }): ReactNode {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img> */}
      <img src={logoSrc} width={64} height={60} alt="" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>
          <span style={{ color: OG_COLORS.foreground }}>Misty</span>
          <span style={{ color: OG_COLORS.link }}>Doces</span>
        </div>
        <span style={{ fontSize: 22, color: OG_COLORS.muted }}>{host}</span>
      </div>
    </div>
  );
}
