import { prisma } from "@/lib/prisma";
import { isPurchasable } from "@/lib/product-availability";
import type { CartVariantSnapshot } from "@/lib/cart";

/**
 * Preço, nome, foto e disponibilidade atuais das variações do carrinho. Variações
 * excluídas simplesmente não voltam — o carrinho entende isso como "saiu do cardápio".
 */
export async function getCartSnapshot(variantIds: string[]): Promise<CartVariantSnapshot[]> {
  if (variantIds.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { category: true } } },
  });

  return variants.map((variant) => ({
    variantId: variant.id,
    productSlug: variant.product.slug,
    productName: variant.product.name,
    variantLabel: variant.label,
    price: Number(variant.price),
    imageUrl: variant.product.imageUrl,
    isAvailable: isPurchasable(variant.product),
    leadTimeDays: variant.product.leadTimeDays,
  }));
}
