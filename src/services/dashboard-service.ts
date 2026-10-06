import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";
import { COUNTED_STATUSES } from "@/services/best-seller-service";
import { STORE_TIME_ZONE, startOfDayInStoreTime, toDayKey } from "@/lib/store-time";

// Reexportados: o painel já importava daqui antes de as funções irem para `lib/store-time`.
export { STORE_TIME_ZONE, startOfDayInStoreTime, toDayKey };

/** Janela do gráfico, do resumo do período e dos mais vendidos. */
export const DASHBOARD_WINDOW_DAYS = 30;
export const TOP_PRODUCTS_LIMIT = 5;
export const RECENT_REVIEWS_LIMIT = 5;

/** Pedidos que ainda pedem ação da loja, na ordem do fluxo. */
export const OPEN_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Os últimos `days` dias, do mais antigo até hoje (inclusive), no fuso da loja. */
export function recentDayKeys(now: Date, days: number): string[] {
  const today = new Date(`${toDayKey(now)}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) =>
    new Date(today.getTime() - (days - 1 - index) * DAY_MS).toISOString().slice(0, 10),
  );
}

export type SalesSummary = { revenue: number; orders: number; averageTicket: number };

// Soma em centavos para não acumular erro de ponto flutuante.
export function summarizeSales(sales: Array<{ total: number }>): SalesSummary {
  const cents = sales.reduce((sum, sale) => sum + Math.round(sale.total * 100), 0);
  return {
    revenue: cents / 100,
    orders: sales.length,
    averageTicket: sales.length > 0 ? Math.round(cents / sales.length) / 100 : 0,
  };
}

/**
 * Variação percentual de `current` sobre `previous`, arredondada. `null` quando não há
 * base de comparação (período anterior zerado) — "+∞%" não ajuda ninguém.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type DailySales = { day: string; revenue: number; orders: number };

/** Vendas por dia, com zero nos dias sem pedido — o gráfico precisa de todos os dias. */
export function groupSalesByDay(
  sales: Array<{ createdAt: Date; total: number }>,
  dayKeys: string[],
): DailySales[] {
  const byDay = new Map(dayKeys.map((day) => [day, { cents: 0, orders: 0 }]));
  for (const sale of sales) {
    const bucket = byDay.get(toDayKey(sale.createdAt));
    if (!bucket) continue;
    bucket.cents += Math.round(sale.total * 100);
    bucket.orders += 1;
  }
  return dayKeys.map((day) => {
    const bucket = byDay.get(day)!;
    return { day, revenue: bucket.cents / 100, orders: bucket.orders };
  });
}

export type TopProduct = {
  productId: string;
  name: string;
  slug: string;
  units: number;
  revenue: number;
};

/** Soma as variantes de cada produto e ordena por unidades (depois faturamento, depois nome). */
export function rankTopProducts(
  sales: Array<{ productId: string; name: string; slug: string; units: number; revenue: number }>,
  limit: number,
): TopProduct[] {
  const byProduct = new Map<string, TopProduct & { cents: number }>();
  for (const sale of sales) {
    const current = byProduct.get(sale.productId) ?? {
      productId: sale.productId,
      name: sale.name,
      slug: sale.slug,
      units: 0,
      revenue: 0,
      cents: 0,
    };
    current.units += sale.units;
    current.cents += Math.round(sale.revenue * 100);
    byProduct.set(sale.productId, current);
  }

  return [...byProduct.values()]
    .map(({ cents, ...product }) => ({ ...product, revenue: cents / 100 }))
    .sort(
      (a, b) => b.units - a.units || b.revenue - a.revenue || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

async function getTopProducts(since: Date): Promise<TopProduct[]> {
  // Mesmo limite do best-seller-service: groupBy não agrupa por campo de relação,
  // então agrupa por variante e soma por produto em memória.
  const salesByVariant = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: { order: { status: { in: COUNTED_STATUSES }, createdAt: { gte: since } } },
    _sum: { quantity: true, subtotal: true },
  });
  if (salesByVariant.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: salesByVariant.map((sale) => sale.variantId) } },
    select: { id: true, product: { select: { id: true, name: true, slug: true } } },
  });
  const productByVariant = new Map(variants.map((variant) => [variant.id, variant.product]));

  return rankTopProducts(
    salesByVariant.flatMap((sale) => {
      const product = productByVariant.get(sale.variantId);
      if (!product) return [];
      return [
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          units: sale._sum.quantity ?? 0,
          revenue: Number(sale._sum.subtotal?.toString() ?? 0),
        },
      ];
    }),
    TOP_PRODUCTS_LIMIT,
  );
}

async function getOpenOrderCounts(): Promise<Array<{ status: OrderStatus; count: number }>> {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    where: { status: { in: OPEN_STATUSES } },
    _count: { _all: true },
  });
  const countByStatus = new Map(groups.map((group) => [group.status, group._count._all]));
  return OPEN_STATUSES.map((status) => ({ status, count: countByStatus.get(status) ?? 0 }));
}

export async function getDashboardData(now = new Date()) {
  // Busca o dobro da janela: a primeira metade é o período anterior, usado na comparação.
  const allKeys = recentDayKeys(now, DASHBOARD_WINDOW_DAYS * 2);
  const dayKeys = allKeys.slice(DASHBOARD_WINDOW_DAYS);
  const previousKeys = new Set(allKeys.slice(0, DASHBOARD_WINDOW_DAYS));
  const since = startOfDayInStoreTime(dayKeys[0]);
  const todayKey = dayKeys[dayKeys.length - 1];
  const yesterdayKey = dayKeys[dayKeys.length - 2];
  // "Ontem neste horário": comparar o dia parcial de hoje com o dia inteiro de ontem seria injusto.
  const sameTimeYesterday = now.getTime() - DAY_MS;

  const [orders, openOrders, topProducts, recentReviews] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: COUNTED_STATUSES },
        createdAt: { gte: startOfDayInStoreTime(allKeys[0]) },
      },
      select: { createdAt: true, total: true },
    }),
    getOpenOrderCounts(),
    getTopProducts(since),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_REVIEWS_LIMIT,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const sales = orders.map((order) => ({
    createdAt: order.createdAt,
    total: Number(order.total.toString()),
    day: toDayKey(order.createdAt),
  }));
  const current = sales.filter((sale) => sale.createdAt.getTime() >= since.getTime());

  return {
    today: summarizeSales(current.filter((sale) => sale.day === todayKey)),
    yesterdaySoFar: summarizeSales(
      sales.filter(
        (sale) => sale.day === yesterdayKey && sale.createdAt.getTime() <= sameTimeYesterday,
      ),
    ),
    period: summarizeSales(current),
    previousPeriod: summarizeSales(sales.filter((sale) => previousKeys.has(sale.day))),
    dailySales: groupSalesByDay(current, dayKeys),
    openOrders,
    topProducts,
    recentReviews,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
