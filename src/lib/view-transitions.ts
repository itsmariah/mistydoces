/**
 * Nome da View Transition da foto de um produto. O card do cardápio e a página do produto
 * usam o mesmo nome — é isso que faz o navegador animar a foto de um lugar para o outro.
 * Só pode existir um elemento com esse nome por página.
 */
export function productImageTransitionName(slug: string) {
  return `produto-${slug}`;
}
