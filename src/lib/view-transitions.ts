/**
 * Nome da View Transition da foto de um produto. O card do cardápio e a página do produto
 * usam o mesmo nome — é isso que faz o navegador animar a foto de um lugar para o outro.
 * Só pode existir um elemento com esse nome por página.
 */
export function productImageTransitionName(slug: string) {
  return `produto-${slug}`;
}

/** `sizes` da foto no card. A tela de carregamento do produto repete o mesmo valor para o
 *  navegador reaproveitar a imagem que já baixou, em vez de pedir outra. */
export const PRODUCT_CARD_IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
