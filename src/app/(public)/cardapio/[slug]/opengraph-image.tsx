import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/catalog";
import { categoryIllustration } from "@/lib/category-illustrations";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgBrand,
  loadOgFonts,
  ogPhotoUrl,
  publicImageDataUrl,
} from "@/lib/og-image";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";
import { formatPriceLabel } from "@/lib/utils";

export const alt = `Doce da ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Preço e foto mudam pelo painel: a prévia se refaz de tempos em tempos, sem ficar velha.
export const revalidate = 600;

const PHOTO_SIZE = OG_SIZE.height;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, fonts, miniLogo] = await Promise.all([
    getProductBySlug(slug),
    loadOgFonts(),
    publicImageDataUrl("branding/25_mini_logo_misty_doces.png"),
  ]);

  // Sem foto, o mesmo visual do card: a ilustração da categoria sobre o círculo lilás.
  const illustration = product?.imageUrl
    ? null
    : await publicImageDataUrl(
        categoryIllustration(product?.category.slug ?? "").replace(/^\//, ""),
      );

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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: PHOTO_SIZE,
            height: PHOTO_SIZE,
            background: "#f3e8dc",
          }}
        >
          {product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img>
            <img
              src={ogPhotoUrl(product.imageUrl, PHOTO_SIZE)}
              width={PHOTO_SIZE}
              height={PHOTO_SIZE}
              alt=""
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 380,
                height: 380,
                borderRadius: 9999,
                background: OG_COLORS.secondary,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={illustration ?? ""}
                alt=""
                style={{ width: 240, height: 240, objectFit: "contain" }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "56px 56px 48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontFamily: "Caveat", fontSize: 40, color: OG_COLORS.link }}>
              {product ? product.category.name.toLowerCase() : "doces artesanais"}
            </span>
            <span
              style={{ display: "block", fontSize: 60, fontWeight: 700, lineHeight: 1.1, lineClamp: 3 }}
            >
              {product?.name ?? SITE_NAME}
            </span>
            {product && (
              <span
                style={{ display: "block", fontSize: 28, color: OG_COLORS.muted, lineClamp: 2 }}
              >
                {product.description}
              </span>
            )}
            {product && (
              <span style={{ fontSize: 44, fontWeight: 700, color: OG_COLORS.link, marginTop: 8 }}>
                {product.isAvailable ? formatPriceLabel(product.variants) : "Esgotado no momento"}
              </span>
            )}
          </div>
          <OgBrand logoSrc={miniLogo} host={SITE_URL.host} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
