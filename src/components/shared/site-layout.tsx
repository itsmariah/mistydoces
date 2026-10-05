import type { ReactNode } from "react";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { BackToTop } from "@/components/shared/back-to-top";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { getCurrentFavorites } from "@/services/favorite-service";
import { MobileTabBar } from "@/components/shared/mobile-tab-bar";

export async function SiteLayout({ children }: { children: ReactNode }) {
  const favorites = await getCurrentFavorites();

  return (
    <FavoritesProvider initialIds={favorites.ids} pendingGuestIds={favorites.pendingGuestIds}>
      {/* Primeiro item do Tab: quem navega por teclado pula direto o menu. */}
      <a
        href="#conteudo"
        className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      {/* Reserva espaço para as barras fixas do celular ("Adicionar" e abas) não cobrirem o rodapé. */}
      <div
        aria-hidden="true"
        className="h-[calc(var(--sticky-bar-height,0px)+var(--tab-bar-height,0px))] sm:hidden"
      />
      <BackToTop />
      <MobileTabBar isLoggedIn={favorites.isLoggedIn} />
    </FavoritesProvider>
  );
}
