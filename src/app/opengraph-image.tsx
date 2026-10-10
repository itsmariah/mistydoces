import { ImageResponse } from "next/og";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgBrand,
  loadOgFonts,
  publicImageDataUrl,
} from "@/lib/og-image";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

// Prévia padrão de qualquer página sem uma própria (a do produto tem a dela).
export const alt = `${SITE_NAME} — doces artesanais feitos com carinho`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const [fonts, logo, miniLogo, strawberry, bow] = await Promise.all([
    loadOgFonts(),
    publicImageDataUrl("branding/01_logo_misty_doces.png"),
    publicImageDataUrl("branding/25_mini_logo_misty_doces.png"),
    publicImageDataUrl("branding/08_morango.png"),
    publicImageDataUrl("branding/29_laco_lilas_2.png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: OG_COLORS.background,
          fontFamily: "Quicksand",
          color: OG_COLORS.foreground,
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 620,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: "Caveat", fontSize: 44, color: OG_COLORS.link }}>
              um doce para alegrar seu dia
            </span>
            <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
              Doces artesanais feitos com carinho
            </span>
            <span style={{ fontSize: 30, color: OG_COLORS.muted, marginTop: 8 }}>
              Brigadeiros, brownies, cookies e kits · entrega ou retirada
            </span>
          </div>
          <OgBrand logoSrc={miniLogo} host={SITE_URL.host} />
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 440,
              height: 440,
              borderRadius: 9999,
              background: OG_COLORS.secondary,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img> */}
          <img src={logo} width={344} height={385} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={strawberry}
            width={66}
            height={76}
            alt=""
            style={{ position: "absolute", top: 20, left: 20, transform: "rotate(-12deg)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bow}
            width={76}
            height={73}
            alt=""
            style={{ position: "absolute", bottom: 30, right: 10, transform: "rotate(10deg)" }}
          />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
