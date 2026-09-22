"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { listCouponsAdmin } from "@/services/coupon-service";
import { deleteCoupon } from "@/actions/coupons";
import { CouponForm } from "@/components/admin/coupon-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Coupon = Awaited<ReturnType<typeof listCouponsAdmin>>[number];

function describeCoupon(coupon: Coupon): string {
  const discount =
    coupon.type === "PERCENTAGE"
      ? `${Number(coupon.value)}%`
      : formatCurrency(coupon.value.toString());

  const parts = [discount];
  if (coupon.minOrderValue) {
    parts.push(`pedido mín. ${formatCurrency(coupon.minOrderValue.toString())}`);
  }
  if (coupon.maxUses) {
    parts.push(`${coupon.usedCount}/${coupon.maxUses} usos`);
  } else {
    parts.push(`${coupon.usedCount} usos`);
  }
  if (coupon.expiresAt) {
    parts.push(`válido até ${new Intl.DateTimeFormat("pt-BR").format(coupon.expiresAt)}`);
  }
  return parts.join(" — ");
}

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshAndClose() {
    setEditingId(null);
    setAddingNew(false);
    router.refresh();
  }

  function handleDelete(couponId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCoupon(couponId);
      if (!result.success) {
        setError(result.error.message);
        setConfirmingDeleteId(null);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {coupons.map((coupon) =>
        editingId === coupon.id ? (
          <CouponForm
            key={coupon.id}
            couponId={coupon.id}
            defaultValues={{
              code: coupon.code,
              type: coupon.type,
              value: Number(coupon.value),
              minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : undefined,
              maxUses: coupon.maxUses ?? undefined,
              isActive: coupon.isActive,
              expiresAt: coupon.expiresAt
                ? coupon.expiresAt.toISOString().slice(0, 10)
                : undefined,
            }}
            onSuccess={refreshAndClose}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={coupon.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{coupon.code}</span>
                {!coupon.isActive && <Badge variant="outline">Inativo</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{describeCoupon(coupon)}</p>
            </div>

            {confirmingDeleteId === coupon.id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">Excluir?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(coupon.id)}
                >
                  Sim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmingDeleteId(null)}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(coupon.id)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingDeleteId(coupon.id)}
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        ),
      )}

      {addingNew ? (
        <CouponForm onSuccess={refreshAndClose} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAddingNew(true)}>
          Adicionar cupom
        </Button>
      )}
    </div>
  );
}
