import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { groupAgenda } = await import("@/services/agenda-service");

type Order = Parameters<typeof groupAgenda>[0][number];

const order = (overrides: Partial<Order>): Order => ({
  id: "o1",
  orderNumber: 1,
  status: "CONFIRMED",
  deliveryType: "PICKUP",
  scheduledFor: new Date("2026-10-05T14:00:00-03:00"),
  customerName: "Ana",
  deliveryNeighborhood: null,
  notes: null,
  items: [],
  ...overrides,
});

describe("groupAgenda", () => {
  it("separa por dia no fuso da loja e ordena pelo horário", () => {
    const days = groupAgenda(
      [
        order({ id: "tarde", scheduledFor: new Date("2026-10-05T18:00:00-03:00") }),
        order({ id: "cedo", scheduledFor: new Date("2026-10-05T13:00:00-03:00") }),
        // 21h no fuso da loja já é 00h UTC do dia seguinte — continua sendo dia 05.
        order({ id: "noite", scheduledFor: new Date("2026-10-05T21:00:00-03:00") }),
        order({ id: "amanha", scheduledFor: new Date("2026-10-06T13:00:00-03:00") }),
      ],
      ["2026-10-05", "2026-10-06", "2026-10-07"],
    );

    expect(days.map((day) => day.orders.map((item) => item.id))).toEqual([
      ["cedo", "tarde", "noite"],
      ["amanha"],
      [],
    ]);
  });

  it("soma a produção do dia por produto e opção, do mais pedido para o menos", () => {
    const [day] = groupAgenda(
      [
        order({
          items: [
            { quantity: 2, productNameSnapshot: "Brigadeiro", variantLabelSnapshot: "Caixa com 6", note: null },
            { quantity: 1, productNameSnapshot: "Bolo de pote", variantLabelSnapshot: "Único", note: null },
          ],
        }),
        order({
          id: "o2",
          items: [
            { quantity: 3, productNameSnapshot: "Brigadeiro", variantLabelSnapshot: "Caixa com 6", note: null },
            { quantity: 1, productNameSnapshot: "Brigadeiro", variantLabelSnapshot: "Unidade", note: null },
          ],
        }),
      ],
      ["2026-10-05"],
    );

    expect(day.production).toEqual([
      { productName: "Brigadeiro", variantLabel: "Caixa com 6", quantity: 5 },
      { productName: "Bolo de pote", variantLabel: "Único", quantity: 1 },
      { productName: "Brigadeiro", variantLabel: "Unidade", quantity: 1 },
    ]);
  });
});
