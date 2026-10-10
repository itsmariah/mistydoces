/**
 * Fundo ambiente do tema escuro (brilho lilás, azul e confeitos — utility `ambient-dark` no
 * globals.css), preso à tela para não rolar junto. No tema claro não aparece.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden ambient-dark dark:block"
    />
  );
}
