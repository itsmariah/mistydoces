"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { getOrderPaymentStatus } from "@/actions/payment";
import { STATUS_LABELS } from "@/components/orders/order-status-badge";

/** Status do pedido mudam em minutos, não segundos — checar mais que isso só gasta servidor. */
const POLL_INTERVAL_MS = 20_000;
const FINAL_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

type OrderStatusWatcherProps = {
  orderId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
};

/**
 * Mantém a página do pedido atualizada sem o cliente recarregar: consulta o status
 * periodicamente e, quando muda, re-renderiza a página (linha do tempo, pagamento…).
 * Pausa com a aba em segundo plano e confere assim que o cliente volta para ela.
 */
export function OrderStatusWatcher({ orderId, status, paymentStatus }: OrderStatusWatcherProps) {
  const router = useRouter();

  useEffect(() => {
    if (FINAL_STATUSES.includes(status)) return;

    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible") return;
      const result = await getOrderPaymentStatus(orderId);
      if (cancelled || !result.success) return;

      const { orderStatus, paymentStatus: nextPaymentStatus } = result.data;
      if (orderStatus !== status) {
        toast(`Seu pedido agora está: ${STATUS_LABELS[orderStatus as OrderStatus]}`);
        router.refresh();
      } else if (paymentStatus && nextPaymentStatus !== paymentStatus) {
        router.refresh();
      }
    }

    const interval = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [orderId, status, paymentStatus, router]);

  return null;
}
