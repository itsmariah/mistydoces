"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DeliveryType, OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { getNextStatuses } from "@/lib/order-status";
import { markPaymentPaid, updateOrderStatus } from "@/actions/admin-orders";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { STATUS_LABELS } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";

function statusLabel(status: OrderStatus, deliveryType: DeliveryType) {
  return status === "DELIVERED" && deliveryType === "PICKUP" ? "Retirado" : STATUS_LABELS[status];
}

export function OrderStatusActions({
  orderId,
  orderNumber,
  status,
  deliveryType,
  paymentStatus,
  paymentProvider,
  canCancel,
  canMarkPaid,
}: {
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentStatus?: PaymentStatus;
  paymentProvider?: string | null;
  canCancel: boolean;
  canMarkPaid: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextStatuses = getNextStatuses(status, deliveryType).filter(
    (next) => next !== "CANCELLED" || canCancel,
  );

  async function changeStatus(next: OrderStatus) {
    const result = await updateOrderStatus(orderId, next);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Pedido #${orderNumber}: ${statusLabel(next, deliveryType)}.`);
    router.refresh();
  }

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markPaymentPaid(orderId);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Pagamento do pedido #${orderNumber} confirmado.`);
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
              onClick={() => startTransition(() => changeStatus(next))}
            >
              Marcar como {statusLabel(next, deliveryType)}
            </Button>
          ))}
        {nextStatuses.includes("CANCELLED") && (
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm" disabled={isPending}>
                Cancelar pedido
              </Button>
            }
            title={`Cancelar o pedido #${orderNumber}?`}
            description="O cliente recebe um e-mail avisando do cancelamento. Essa ação não pode ser desfeita."
            confirmLabel="Cancelar pedido"
            destructive
            onConfirm={() => changeStatus("CANCELLED")}
          />
        )}
        {canMarkPaidManually && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleMarkPaid}>
            Marcar pagamento como pago
          </Button>
        )}
      </div>
    </div>
  );
}
