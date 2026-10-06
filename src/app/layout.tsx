import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Quicksand } from "next/font/google";
import Script from "next/script";
import { THEME_STORAGE_KEY, ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationTracker } from "@/components/shared/navigation-tracker";
import { BASE_OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/site-metadata";
import "./globals.css";

// Roda antes da hidratação para aplicar o tema salvo/preferido sem "flash" de tela clara.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Fonte de "momento de marca" — uso pontual (hero, estados vazios, e-mails),
// nunca em texto operacional. Ver seção 3 do Design System MistyDoces.
const caveat = Caveat({
  variable: "--font-display",
  weight: ["700"],
  subsets: ["latin"],
});

const SITE_DESCRIPTION = "Cardápio e pedidos online de uma confeitaria artesanal.";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { ...BASE_OPEN_GRAPH, title: SITE_NAME, description: SITE_DESCRIPTION },
  // Aberto pela tela inicial do iPhone: abre como app, com o nome curto embaixo do ícone.
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
};

// Cor da barra do navegador/sistema = fundo da página em cada tema (globals.css).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e17" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${quicksand.variable} ${caveat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
          <Toaster
            position="bottom-center"
            containerAriaLabel="Notificações"
            // No celular, os avisos sobem acima das barras fixas (abas e "Adicionar").
            mobileOffset={{
              bottom: "calc(16px + var(--tab-bar-height, 0px) + var(--sticky-bar-height, 0px))",
            }}
            // Entre 600px e 640px o sonner já usa o `offset` de desktop, mas a barra ainda aparece.
            offset={{ bottom: "calc(24px + var(--tab-bar-height, 0px))" }}
          />
          <NavigationTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
