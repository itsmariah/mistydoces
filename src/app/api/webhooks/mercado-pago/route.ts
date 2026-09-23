import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import * as paymentService from "@/services/payment-service";

// Endpoint público (sem auth de sessão) — a autenticidade da notificação vem
// da assinatura HMAC do Mercado Pago, verificada dentro do service.
export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  try {
    await paymentService.processWebhookNotification({
      type: url.searchParams.get("type"),
      dataId: url.searchParams.get("data.id"),
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const status = error instanceof AppError ? error.httpStatus : 500;
    console.error("Falha ao processar webhook do Mercado Pago:", error);
    return NextResponse.json({ error: "invalid_notification" }, { status });
  }
}
