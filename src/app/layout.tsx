import type { Metadata } from "next";
import { Caveat, Inter, Quicksand } from "next/font/google";
import Script from "next/script";
import { THEME_STORAGE_KEY, ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";
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
          <Toaster position="bottom-center" containerAriaLabel="Notificações" />
        </ThemeProvider>
      </body>
    </html>
  );
}
