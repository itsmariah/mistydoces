/** Ilustração usada quando o produto ainda não tem foto. */
const FALLBACK_IMAGE = "/branding/07_cupcake.png";
const SIZE = 48;
const DURATION_MS = 650;
/** Quanto a miniatura sobe antes de cair na sacola — é o que desenha o arco. */
const ARC_HEIGHT = 90;

/** Sacola visível agora: a do cabeçalho (computador) ou a da barra de abas (celular). */
function findCartTarget(): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>("[data-cart-target]");
  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return target;
  }
  return null;
}

/**
 * Miniatura do produto voando em arco do botão até a sacola. Resolve quando chega (é a
 * hora de atualizar o número da sacola). Sem animação possível (movimento reduzido,
 * navegador sem Web Animations ou sacola fora da tela), resolve na hora.
 */
export function flyToCart(from: HTMLElement, imageUrl: string | null): Promise<void> {
  const target = findCartTarget();
  if (
    !target ||
    typeof document.body.animate !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return Promise.resolve();
  }

  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const startX = start.left + start.width / 2 - SIZE / 2;
  const startY = start.top + start.height / 2 - SIZE / 2;
  const dx = end.left + end.width / 2 - SIZE / 2 - startX;
  const dy = end.top + end.height / 2 - SIZE / 2 - startY;

  // Dois elementos: o de fora anda na horizontal em ritmo constante, o de dentro sobe e
  // cai com aceleração — juntos, desenham uma parábola em vez de uma linha reta.
  const outer = document.createElement("div");
  outer.setAttribute("aria-hidden", "true");
  Object.assign(outer.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    zIndex: "100",
    pointerEvents: "none",
  });
  const image = document.createElement("img");
  image.src = imageUrl ?? FALLBACK_IMAGE;
  image.alt = "";
  Object.assign(image.style, {
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    borderRadius: "9999px",
    objectFit: "cover",
    background: "var(--card)",
    border: "2px solid var(--card)",
    boxShadow: "var(--shadow-card)",
  });
  outer.appendChild(image);
  document.body.appendChild(outer);

  const peak = Math.min(0, dy) - ARC_HEIGHT;
  outer.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration: DURATION_MS,
    easing: "linear",
  });
  const flight = image.animate(
    [
      { transform: "translateY(0) scale(1)", easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
      { transform: `translateY(${peak}px) scale(0.85)`, offset: 0.35, easing: "cubic-bezier(0.5, 0, 0.9, 0.4)" },
      { transform: `translateY(${dy}px) scale(0.3)`, opacity: 0.7 },
    ],
    { duration: DURATION_MS, fill: "forwards" },
  );

  return flight.finished
    .catch(() => undefined)
    .then(() => {
      outer.remove();
    });
}
