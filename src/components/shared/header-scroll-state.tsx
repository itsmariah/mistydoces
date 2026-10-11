"use client";

import { useEffect } from "react";

// Faixa morta entre os dois limites: o cabeçalho encolhe 8px, e sem ela um scroll parado
// bem no limite poderia ficar alternando entre os dois tamanhos.
const SHRINK_AFTER_PX = 24;
const GROW_BEFORE_PX = 8;

/**
 * Marca `<html data-scrolled>` quando a página saiu do topo. O cabeçalho encolhe (64 → 56px)
 * e ganha sombra via `--header-h` (globals.css), e as barras fixas abaixo dele acompanham.
 */
export function HeaderScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    function update() {
      frame = 0;
      const scrolled = root.hasAttribute("data-scrolled");
      if (!scrolled && window.scrollY > SHRINK_AFTER_PX) root.setAttribute("data-scrolled", "");
      else if (scrolled && window.scrollY < GROW_BEFORE_PX) root.removeAttribute("data-scrolled");
    }

    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
      // Saindo da loja (ex.: para o painel), o atributo não pode ficar para trás.
      root.removeAttribute("data-scrolled");
    };
  }, []);

  return null;
}
