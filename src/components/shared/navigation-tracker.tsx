"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Estado de módulo (não de componente): o link "Voltar ao cardápio" precisa ler de onde o
// cliente veio sem depender de props ou contexto, e o tracker vive o app inteiro no layout raiz.
const navigationState = { previousPathname: null as string | null };

/** Pathname da página anterior nesta aba (navegação client-side), ou null na primeira página. */
export function getPreviousPathname() {
  return navigationState.previousPathname;
}

/**
 * Montado uma vez no layout raiz. Faz duas coisas:
 * - lembra o pathname anterior, para "Voltar ao cardápio" poder usar o histórico;
 * - marca `<html data-nav="pop">` em navegações de voltar/avançar do histórico, para as
 *   animações de entrada não se repetirem numa página restaurada (ver globals.css).
 *   Qualquer clique ou tecla depois disso volta a marcar "push" — é uma interação nova.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const currentPathname = useRef<string | null>(null);

  useEffect(() => {
    if (currentPathname.current !== null && currentPathname.current !== pathname) {
      navigationState.previousPathname = currentPathname.current;
    }
    currentPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const markPop = () => {
      root.dataset.nav = "pop";
    };
    const markPush = () => {
      root.dataset.nav = "push";
    };

    window.addEventListener("popstate", markPop);
    document.addEventListener("click", markPush, { capture: true });
    document.addEventListener("keydown", markPush, { capture: true });
    return () => {
      window.removeEventListener("popstate", markPop);
      document.removeEventListener("click", markPush, { capture: true });
      document.removeEventListener("keydown", markPush, { capture: true });
    };
  }, []);

  return null;
}
