import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  order: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  orderItem: {
    groupBy: vi.fn(),
  },
  productVariant: {
    findMany: vi.fn(),
  },
  review: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const {
  toDayKey,
  startOfDayInStoreTime,
  recentDayKeys,
  summarizeSales,
  groupSalesByDay,
  rankTopProducts,
  getDashboardData,
} = await import("@/services/dashboard-service");

describe("fuso horário da loja", () => {
  it("pedido às 22h30 em São Paulo conta no mesmo dia, não no seguinte (UTC)", () => {
    // 2026-09-27 01:30 UTC = 2026-09-26 22:30 em São Paulo
    expect(toDayKey(new Date("2026-09-27T01:30:00Z"))).toBe("2026-09-26");
  });

  it("a meia-noite em São Paulo é 03:00 UTC", () => {
    expect(startOfDayInStoreTime("2026-09-26").toISOString()).toBe("2026-09-26T03:00:00.000Z");
  });

  it("lista os últimos dias do mais antigo até hoje, atravessando a virada de mês", () => {
    const days = recentDayKeys(new Date("2026-10-02T12:00:00Z"), 4);
    expect(days).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });
});

describe("summarizeSales", () => {
  it("calcula faturamento, pedidos e ticket médio sem erro de ponto flutuante", () => {
    expect(summarizeSales([{ total: 0.1 }, { total: 0.2 }, { total: 10 }])).toEqual({
      revenue: 10.3,
      orders: 3,
      averageTicket: 3.43,
    });
  });

  it("devolve zeros quando não há vendas", () => {
    expect(summarizeSales([])).toEqual({ revenue: 0, orders: 0, averageTicket: 0 });
  });
});

describe("groupSalesByDay", () => {
  it("preenche com zero os dias sem venda e ignora vendas fora da janela", () => {
    const result = groupSalesByDay(
      [
        { createdAt: new Date("2026-09-25T15:00:00Z"), total: 30 },
        { createdAt: new Date("2026-09-25T18:00:00Z"), total: 20.5 },
        { createdAt: new Date("2026-09-20T15:00:00Z"), total: 99 },
      ],
      ["2026-09-24", "2026-09-25", "2026-09-26"],
    );

    expect(result).toEqual([
      { day: "2026-09-24", revenue: 0, orders: 0 },
      { day: "2026-09-25", revenue: 50.5, orders: 2 },
      { day: "2026-09-26", revenue: 0, orders: 0 },
    ]);
  });
});

describe("rankTopProducts", () => {
  it("soma variantes do mesmo produto e ordena por unidades", () => {
    const result = rankTopProducts(
      [
        { productId: "bolo", name: "Bolo", slug: "bolo", units: 2, revenue: 100 },
        { productId: "cookie", name: "Cookie", slug: "cookie", units: 3, revenue: 30 },
        { productId: "bolo", name: "Bolo", slug: "bolo", units: 2, revenue: 60 },
      ],
      5,
    );

    expect(result.map((p) => [p.productId, p.units, p.revenue])).toEqual([
      ["bolo", 4, 160],
      ["cookie", 3, 30],
    ]);
  });

  it("desempata por faturamento e respeita o limite", () => {
    const result = rankTopProducts(
      [
        { productId: "a", name: "A", slug: "a", units: 2, revenue: 10 },
        { productId: "b", name: "B", slug: "b", units: 2, revenue: 50 },
        { productId: "c", name: "C", slug: "c", units: 1, revenue: 500 },
      ],
      2,
    );

    expect(result.map((p) => p.productId)).toEqual(["b", "a"]);
  });
});

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.order.groupBy.mockResolvedValue([]);
    prismaMock.orderItem.groupBy.mockResolvedValue([]);
    prismaMock.productVariant.findMany.mockResolvedValue([]);
    prismaMock.review.findMany.mockResolvedValue([]);
  });

  it("separa o resumo de hoje do resumo do período", async () => {
    prismaMock.order.findMany.mockResolvedValue([
      { createdAt: new Date("2026-09-26T13:00:00Z"), total: "40.00" },
      { createdAt: new Date("2026-09-20T13:00:00Z"), total: "60.00" },
    ]);

    const data = await getDashboardData(new Date("2026-09-26T20:00:00Z"));

    expect(data.today).toEqual({ revenue: 40, orders: 1, averageTicket: 40 });
    expect(data.period).toEqual({ revenue: 100, orders: 2, averageTicket: 50 });
    expect(data.dailySales).toHaveLength(30);
  });

  it("busca os pedidos a partir da meia-noite (São Paulo) do primeiro dia da janela", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    await getDashboardData(new Date("2026-09-26T20:00:00Z"));

    const where = prismaMock.order.findMany.mock.calls[0][0].where;
    expect(where.createdAt.gte.toISOString()).toBe("2026-08-28T03:00:00.000Z");
    expect(where.status.in).not.toContain("PENDING");
    expect(where.status.in).not.toContain("CANCELLED");
  });

  it("lista todos os status em aberto, com zero nos que não têm pedido", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.groupBy.mockResolvedValue([
      { status: "PREPARING", _count: { _all: 2 } },
      { status: "PENDING", _count: { _all: 1 } },
    ]);

    const data = await getDashboardData(new Date("2026-09-26T20:00:00Z"));

    expect(data.openOrders).toEqual([
      { status: "PENDING", count: 1 },
      { status: "CONFIRMED", count: 0 },
      { status: "PREPARING", count: 2 },
      { status: "READY", count: 0 },
      { status: "OUT_FOR_DELIVERY", count: 0 },
    ]);
  });

  it("agrupa os mais vendidos por produto a partir das variantes", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.orderItem.groupBy.mockResolvedValue([
      { variantId: "v1", _sum: { quantity: 2, subtotal: "50.00" } },
      { variantId: "v2", _sum: { quantity: 1, subtotal: "40.00" } },
    ]);
    prismaMock.productVariant.findMany.mockResolvedValue([
      { id: "v1", product: { id: "bolo", name: "Bolo", slug: "bolo" } },
      { id: "v2", product: { id: "bolo", name: "Bolo", slug: "bolo" } },
    ]);

    const data = await getDashboardData(new Date("2026-09-26T20:00:00Z"));

    expect(data.topProducts).toEqual([
      { productId: "bolo", name: "Bolo", slug: "bolo", units: 3, revenue: 90 },
    ]);
  });
});
