import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

/** Quantos produtos recebem o selo "Mais vendido" ao mesmo tempo. */
export const BEST_SELLER_LIMIT = 3;
/** Janela de vendas considerada — mantém o selo refletindo o que sai agora, não o histórico todo. */
export const BEST_SELLER_WINDOW_DAYS = 90;
/** Mínimo de unidades para ganhar o selo — evita marcar qualquer coisa com 1 venda enquanto a loja é nova. */
export const BEST_SELLER_MIN_UNITS = 3;

// Só pedidos que a loja aceitou: PENDING pode ser um Pix nunca pago, CANCELLED não virou venda.
const COUNTED_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** Ordena produtos por unidades vendidas e devolve os ids que ganham o selo. */
export function rankBestSellers(
  sales: Array<{ productId: string; units: number }>,
): Set<string> {
  const unitsByProduct = new Map<string, number>();
  for (const { productId, units } of sales) {
    unitsByProduct.set(productId, (unitsByProduct.get(productId) ?? 0) + units);
  }

  const ranked = [...unitsByProduct.entries()]
    .filter(([, units]) => units >= BEST_SELLER_MIN_UNITS)
    // Desempate pelo id só para o resultado ser estável entre requisições.
    .sort(([idA, unitsA], [idB, unitsB]) => unitsB - unitsA || idA.localeCompare(idB))
    .slice(0, BEST_SELLER_LIMIT);

  return new Set(ranked.map(([productId]) => productId));
}

/** Unidades vendidas por produto na janela recente — base do selo e da ordenação "mais vendidos". */
export async function getUnitsSoldByProduct(now = new Date()): Promise<Map<string, number>> {
  const since = new Date(now.getTime() - BEST_SELLER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // groupBy não agrupa por campo de relação (variant.productId), então agrupa por
  // variante e soma por produto em memória — o número de variantes é pequeno.
  const salesByVariant = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: {
      order: { status: { in: COUNTED_STATUSES }, createdAt: { gte: since } },
      variant: { product: { isActive: true } },
    },
    _sum: { quantity: true },
  });
  if (salesByVariant.length === 0) return new Map();

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: salesByVariant.map((sale) => sale.variantId) } },
    select: { id: true, productId: true },
  });
  const productIdByVariant = new Map(variants.map((v) => [v.id, v.productId]));

  const unitsByProduct = new Map<string, number>();
  for (const sale of salesByVariant) {
    const productId = productIdByVariant.get(sale.variantId);
    if (!productId) continue;
    unitsByProduct.set(productId, (unitsByProduct.get(productId) ?? 0) + (sale._sum.quantity ?? 0));
  }
  return unitsByProduct;
}

export function rankBestSellersFromUnits(unitsByProduct: Map<string, number>): Set<string> {
  return rankBestSellers(
    [...unitsByProduct].map(([productId, units]) => ({ productId, units })),
  );
}

export async function getBestSellerProductIds(now = new Date()): Promise<Set<string>> {
  return rankBestSellersFromUnits(await getUnitsSoldByProduct(now));
}
