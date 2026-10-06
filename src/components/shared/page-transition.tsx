"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Troca suave entre páginas da loja: a antiga some rápido e a nova sobe aparecendo. A
 * `key` pelo caminho faz a transição acontecer só ao mudar de página — salvar um
 * formulário, favoritar ou filtrar o cardápio (muda só a query) não dispara nada.
 * Navegador sem View Transitions: troca instantânea, como antes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
