import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site-metadata";

/**
 * Manifest do PWA: permite "Adicionar à tela inicial" e abrir a loja como app (sem a
 * barra do navegador). Cores = fundo creme e lilás da marca (globals.css, tema claro).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Doces artesanais feitos com carinho — peça pelo celular e acompanhe seu pedido.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf3ea",
    theme_color: "#fbf3ea",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Atalhos do ícone (toque longo no Android).
    shortcuts: [
      { name: "Cardápio", url: "/cardapio", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Meus pedidos", url: "/conta/pedidos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Favoritos", url: "/favoritos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
