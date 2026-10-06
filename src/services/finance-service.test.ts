import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  order: { aggregate: vi.fn() },
  expense: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  $executeRaw: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/notification-service", () => ({ sendBreakEvenEmail: vi.fn() }));

const { checkBreakEven, getFinanceMonth } = await import("@/services/finance-service");
const notificationService = await import("@/services/notification-service");

/** 06/10/2026, 14h em São Paulo. */
const NOW = new Date("2026-10-06T17:00:00Z");
const OWNERS = [{ name: "Maria", email: "maria@example.com" }];

function mockMonth(revenue: string | null, amounts: string[]) {
  prismaMock.order.aggregate.mockResolvedValue({
    _sum: { total: revenue },
    _count: { _all: revenue ? 3 : 0 },
  });
  prismaMock.expense.findMany.mockResolvedValue(
    amounts.map((amount, index) => ({ id: `e${index}`, category: "MATERIAL", amount })),
  );
}

describe("getFinanceMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca vendas e despesas do mês no fuso da loja", async () => {
    mockMonth("250.00", ["75.00"]);
    const { summary, orders } = await getFinanceMonth("2026-10");

    expect(summary).toMatchObject({ revenue: 250, expenses: 75, result: 175 });
    expect(orders).toBe(3);
    expect(prismaMock.order.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          // Meia-noite de São Paulo (UTC−3) do dia 1 até o dia 1 do mês seguinte.
          createdAt: {
            gte: new Date("2026-10-01T03:00:00Z"),
            lt: new Date("2026-11-01T03:00:00Z"),
          },
        }),
      }),
    );
    expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { date: { gte: "2026-10-01", lt: "2026-11-01" } } }),
    );
  });
});

describe("checkBreakEven", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findMany.mockResolvedValue(OWNERS);
  });

  it("avisa os proprietários quando o faturamento cobre as despesas", async () => {
    mockMonth("80.00", ["75.00"]);
    prismaMock.$executeRaw.mockResolvedValue(1);

    await checkBreakEven(NOW);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "OWNER" } }),
    );
    expect(notificationService.sendBreakEvenEmail).toHaveBeenCalledWith(OWNERS, {
      month: "2026-10",
      monthName: "outubro",
      revenue: 80,
      expenses: 75,
      result: 5,
    });
  });

  it("não avisa enquanto o faturamento não alcança as despesas", async () => {
    mockMonth("74.99", ["75.00"]);
    await checkBreakEven(NOW);
    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    expect(notificationService.sendBreakEvenEmail).not.toHaveBeenCalled();
  });

  it("não avisa sem despesas cadastradas", async () => {
    mockMonth("500.00", []);
    await checkBreakEven(NOW);
    expect(notificationService.sendBreakEvenEmail).not.toHaveBeenCalled();
  });

  it("não repete o aviso se o banco já registrou esse total (ou outro processo ganhou)", async () => {
    mockMonth("80.00", ["75.00"]);
    prismaMock.$executeRaw.mockResolvedValue(0);

    await checkBreakEven(NOW);

    expect(notificationService.sendBreakEvenEmail).not.toHaveBeenCalled();
  });

  it("nunca lança: uma falha no banco só é logada", async () => {
    prismaMock.order.aggregate.mockRejectedValue(new Error("db fora"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(checkBreakEven(NOW)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
