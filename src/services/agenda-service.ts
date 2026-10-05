import { prisma } from "@/lib/prisma";
import type { DeliveryType, OrderStatus } from "@/generated/prisma/client";
import { addDays, startOfDayInStoreTime, toDayKey } from "@/lib/store-time";

/** Quantos dias a agenda mostra, contando hoje. */
export const AGENDA_DAYS = 7;

export type AgendaOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  scheduledFor: Date;
  customerName: string;
  deliveryNeighborhood: string | null;
  notes: string | null;
  items: { quantity: number; productNameSnapshot: string; variantLabelSnapshot: string }[];
};

/** Quanto produzir de cada item no dia: "12x Brigadeiro (Caixa com 6)". */
export type ProductionLine = { productName: string; variantLabel: string; quantity: number };

export type AgendaDay = { dayKey: string; orders: AgendaOrder[]; production: ProductionLine[] };

/**
 * Separa os pedidos por dia (fuso da loja), em ordem de horário, e soma o que a cozinha
 * precisa produzir em cada dia — do item mais pedido para o menos.
 */
export function groupAgenda(orders: AgendaOrder[], dayKeys: string[]): AgendaDay[] {
  return dayKeys.map((dayKey) => {
    const dayOrders = orders
      .filter((order) => toDayKey(order.scheduledFor) === dayKey)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    const totals = new Map<string, ProductionLine>();
    for (const order of dayOrders) {
      for (const item of order.items) {
        const key = `${item.productNameSnapshot}\u0000${item.variantLabelSnapshot}`;
        const line = totals.get(key) ?? {
          productName: item.productNameSnapshot,
          variantLabel: item.variantLabelSnapshot,
          quantity: 0,
        };
        line.quantity += item.quantity;
        totals.set(key, line);
      }
    }
    const production = [...totals.values()].sort(
      (a, b) => b.quantity - a.quantity || a.productName.localeCompare(b.productName, "pt-BR"),
    );

    return { dayKey, orders: dayOrders, production };
  });
}

/** Pedidos agendados de hoje até `days` dias à frente, sem os cancelados. */
export async function getAgenda(now: Date, days = AGENDA_DAYS): Promise<AgendaDay[]> {
  const today = toDayKey(now);
  const dayKeys = Array.from({ length: days }, (_, offset) => addDays(today, offset));

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      scheduledFor: {
        gte: startOfDayInStoreTime(today),
        lt: startOfDayInStoreTime(addDays(today, days)),
      },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      deliveryType: true,
      scheduledFor: true,
      deliveryNeighborhood: true,
      notes: true,
      user: { select: { name: true } },
      items: { select: { quantity: true, productNameSnapshot: true, variantLabelSnapshot: true } },
    },
  });

  return groupAgenda(
    orders.map(({ user, scheduledFor, ...order }) => ({
      ...order,
      // O filtro do `where` garante a data; o tipo do Prisma ainda a vê como opcional.
      scheduledFor: scheduledFor!,
      customerName: user.name,
    })),
    dayKeys,
  );
}
