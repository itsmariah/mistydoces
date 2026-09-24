import type { ReactNode } from "react";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { BackToTop } from "@/components/shared/back-to-top";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
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
      {/* Reserva espaço para a barra fixa de "Adicionar" do celular não cobrir o fim do rodapé. */}
      <div aria-hidden="true" className="h-[var(--sticky-bar-height,0px)] sm:hidden" />
      <BackToTop />
    </>
  );
}
