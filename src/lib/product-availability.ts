type PurchasableProduct = {
  isActive: boolean;
  isAvailable: boolean;
  category: { isActive: boolean };
};

/**
 * Regra única de "dá para comprar": produto ativo, não esgotado e em categoria ativa.
 * O checkout recusa com ela e o carrinho usa a mesma para marcar itens indisponíveis.
 */
export function isPurchasable(product: PurchasableProduct): boolean {
  return product.isActive && product.isAvailable && product.category.isActive;
}
