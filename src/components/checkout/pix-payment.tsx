"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPixPayment, getOrderPaymentStatus } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderThanks } from "@/components/orders/order-thanks";
import { formatCurrency } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

type PixData = {
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: Date | null;
};

export function PixPayment({
  orderId,
  total,
  initial,
}: {
  orderId: string;
  total: number;
  initial: (PixData & { status: string }) | null;
}) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [pix, setPix] = useState<PixData | null>(initial);
  const [status, setStatus] = useState(initial?.status ?? "PENDING");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pix?.qrCode || status === "PAID" || status === "FAILED" || status === "EXPIRED") return;

    pollRef.current = setInterval(async () => {
      const result = await getOrderPaymentStatus(orderId);
      if (!result.success) return;
      setStatus(result.data.paymentStatus);
      if (result.data.paymentStatus === "PAID") {
        if (pollRef.current) clearInterval(pollRef.current);
        router.refresh();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pix?.qrCode, status, orderId, router]);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await createPixPayment({ orderId, document: cpf });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPix(result.data);
      setStatus(result.data.status);
    });
  }

  async function handleCopy() {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "PAID") {
    return (
      <OrderThanks
        title="Pagamento aprovado!"
        description="Seu pedido já foi confirmado. Obrigada por fazer parte dessa doçura!"
      />
    );
  }

  if (!pix?.qrCode) {
    return (
      <div className="space-y-4 rounded-lg border border-border p-6">
        <div>
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="font-heading text-2xl font-semibold text-link">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="document">CPF do pagador</Label>
          <Input
            id="document"
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Exigido pelo Mercado Pago para gerar a cobrança Pix.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleGenerate} disabled={isPending} className="w-full">
          {isPending ? "Gerando QR code..." : "Gerar QR code Pix"}
        </Button>
      </div>
    );
  }

  const isStale = status === "FAILED" || status === "EXPIRED";

  return (
    <div className="space-y-4 rounded-lg border border-border p-6 text-center">
      {isStale ? (
        <>
          <p className="text-sm text-destructive">
            Este QR code {status === "EXPIRED" ? "expirou" : "não foi aprovado"}.
          </p>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Gerando novo QR code..." : "Gerar novo QR code"}
          </Button>
        </>
      ) : (
        <>
          {pix.qrCodeBase64 && (
            <Image
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR code Pix"
              width={224}
              height={224}
              unoptimized
              className="mx-auto h-56 w-56"
            />
          )}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="pix-copy-paste">Pix copia e cola</Label>
            <div className="flex gap-2">
              <Input id="pix-copy-paste" readOnly value={pix.qrCode} className="font-mono text-xs" />
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Aguardando confirmação do pagamento — esta página atualiza sozinha.
          </p>
        </>
      )}
    </div>
  );
}
