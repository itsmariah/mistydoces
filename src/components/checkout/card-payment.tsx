"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment as PaymentBrick } from "@mercadopago/sdk-react";
import { createCardPayment, getOrderPaymentStatus } from "@/actions/payment";
import { formatCurrency } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

// A API do MP só precisa ser inicializada uma vez por carregamento de página.
let mercadoPagoInitialized = false;

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: "Cartão sem saldo/limite suficiente.",
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
  cc_rejected_call_for_authorize: "Cartão exige autorização — entre em contato com seu banco.",
  cc_rejected_card_disabled: "Cartão desabilitado — entre em contato com seu banco.",
  cc_rejected_high_risk: "Pagamento recusado por segurança. Tente outro cartão.",
};

function rejectionMessage(statusDetail: string | null): string {
  if (statusDetail && REJECTION_MESSAGES[statusDetail]) return REJECTION_MESSAGES[statusDetail];
  return "Pagamento recusado. Verifique os dados ou tente outro cartão.";
}

export function CardPayment({
  orderId,
  total,
  payerEmail,
  initialStatus,
}: {
  orderId: string;
  total: number;
  payerEmail: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [brickKey, setBrickKey] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    if (publicKey && !mercadoPagoInitialized) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
      mercadoPagoInitialized = true;
    }
  }, []);

  useEffect(() => {
    if (status !== "PROCESSING") return;

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
  }, [status, orderId, router]);

  if (status === "PAID") {
    return (
      <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="font-heading text-lg font-medium text-primary">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Seu pedido já foi confirmado.</p>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="space-y-2 rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Confirmando seu pagamento — esta página atualiza sozinha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Valor a pagar</p>
        <p className="font-heading text-2xl font-semibold text-primary">
          {formatCurrency(total)}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <PaymentBrick
        key={brickKey}
        initialization={{ amount: total, payer: { email: payerEmail } }}
        customization={{ paymentMethods: { creditCard: "all" } }}
        onSubmit={async ({ formData }) => {
          setError(null);
          const result = await createCardPayment({ orderId, formData });

          if (!result.success) {
            setError(result.error.message);
            throw new Error(result.error.message);
          }

          if (result.data.status === "FAILED") {
            const message = rejectionMessage(result.data.statusDetail);
            setError(message);
            setBrickKey((key) => key + 1);
            throw new Error(message);
          }

          setStatus(result.data.status);
        }}
        onError={(brickError) => {
          console.error("Erro no Payment Brick:", brickError);
          setError("Não foi possível carregar o formulário de pagamento. Recarregue a página.");
        }}
      />
    </div>
  );
}
