"use client";

import type { ReactNode } from "react";
import { useNewOrdersAfter } from "@/components/admin/order-alerts";
import { cn } from "@/lib/utils";

/**
 * Envolve uma linha da lista de pedidos: se o pedido acabou de chegar (aviso de pedido
 * novo do painel), a linha entra com um brilho lilás para a equipe achá-la de cara.
 */
export function NewOrderHighlight({
  orderNumber,
  children,
}: {
  orderNumber: number;
  children: ReactNode;
}) {
  const newOrdersAfter = useNewOrdersAfter();
  const isNew = newOrdersAfter !== null && orderNumber > newOrdersAfter;

  return <div className={cn("rounded-lg", isNew && "animate-new-order")}>{children}</div>;
}
