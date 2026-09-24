import type { ReactNode } from "react";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { BackToTop } from "@/components/shared/back-to-top";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Reserva espaço para a barra fixa de "Adicionar" do celular não cobrir o fim do rodapé. */}
      <div aria-hidden="true" className="h-[var(--sticky-bar-height,0px)] sm:hidden" />
      <BackToTop />
    </>
  );
}
