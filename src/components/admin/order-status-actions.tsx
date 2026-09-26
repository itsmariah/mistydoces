"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DeliveryType, OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { getNextStatuses } from "@/lib/order-status";
import { markPaymentPaid, updateOrderStatus } from "@/actions/admin-orders";
import { STATUS_LABELS } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";

export function OrderStatusActions({
  orderId,
  status,
  deliveryType,
  paymentStatus,
  paymentProvider,
  canCancel,
  canMarkPaid,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentStatus?: PaymentStatus;
  paymentProvider?: string | null;
  canCancel: boolean;
  canMarkPaid: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = getNextStatuses(status, deliveryType).filter(
    (next) => next !== "CANCELLED" || canCancel,
  );

  function handleTransition(next: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function handleMarkPaid() {
    setError(null);
    startTransition(async () => {
      const result = await markPaymentPaid(orderId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  const canMarkPaidManually = canMarkPaid && paymentStatus === "PENDING" && !paymentProvider;

  if (nextStatuses.length === 0 && !canMarkPaidManually) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Ações</p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses
          .filter((next) => next !== "CANCELLED")
          .map((next) => (
            <Button
              key={next}
              size="sm"
              disabled={isPending}
              onClick={() => handleTransition(next)}
            >
              {next === "DELIVERED" && deliveryType === "PICKUP"
                ? "Marcar como Retirado"
                : `Marcar como ${STATUS_LABELS[next]}`}
            </Button>
          ))}
        {nextStatuses.includes("CANCELLED") && (
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleTransition("CANCELLED")}
          >
            Cancelar pedido
          </Button>
        )}
        {canMarkPaidManually && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleMarkPaid}
          >
            Marcar pagamento como pago
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
