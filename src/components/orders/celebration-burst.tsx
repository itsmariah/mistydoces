"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useMounted } from "@/lib/use-mounted";

const PIECES = [
  { src: "/branding/10_coracao_patinha.png", width: 220, height: 221 },
  { src: "/branding/28_coracao_lilas.png", width: 131, height: 112 },
  { src: "/branding/09_florsinha_azul.png", width: 131, height: 133 },
  { src: "/branding/26_moranguinho.png", width: 160, height: 165 },
  { src: "/branding/22_coracao_xadrez_com_laco.png", width: 272, height: 265 },
];

const PIECE_COUNT = 24;
/** Tempo até todos os pedaços terminarem de cair (maior atraso + maior duração), com folga. */
const TOTAL_DURATION_MS = 4200;

// Valores "aleatórios" calculados pelo índice: espalhados, mas iguais a cada render.
const CONFETTI = Array.from({ length: PIECE_COUNT }, (_, index) => {
  const piece = PIECES[index % PIECES.length];
  return {
    ...piece,
    key: index,
    left: `${(index * 37 + 7) % 100}%`,
    size: 20 + ((index * 13) % 18),
    style: {
      "--confetti-delay": `${(index * 53) % 900}ms`,
      "--confetti-duration": `${2.2 + ((index * 7) % 10) / 10}s`,
      "--confetti-drift": `${((index * 29) % 120) - 60}px`,
      "--confetti-spin": `${index % 2 === 0 ? "" : "-"}${180 + ((index * 41) % 360)}deg`,
    } as CSSProperties,
  };
});

/**
 * Chuva de patinhas, corações e moranguinhos ao concluir o pedido. Toca uma vez e some.
 * Não aparece para quem pediu menos movimento no sistema, nem atrapalha cliques.
 */
export function CelebrationBurst() {
  const mounted = useMounted();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), TOTAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // `mounted`: a preferência de movimento só existe no navegador.
  if (!mounted || done) return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CONFETTI.map(({ key, src, width, height, left, size, style }) => (
        <Image
          key={key}
          src={src}
          alt=""
          width={width}
          height={height}
          className="absolute top-0 h-auto animate-confetti"
          style={{ ...style, left, width: size }}
        />
      ))}
    </div>
  );
}
