import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/require-permission";
import { AppError } from "@/lib/errors";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/payment-labels";
import { SITE_URL } from "@/lib/site-metadata";
import { formatScheduledFor } from "@/lib/scheduling";
import { cn, formatCurrency } from "@/lib/utils";
import { adminGetOrderById } from "@/services/order-service";
import { getStoreContact } from "@/services/store-settings-service";
import { PrintButton } from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Imprimir pedido" };

const PRINT_OPTIONS = [
  { value: "tudo", label: "Comanda + cartão" },
  { value: "comanda", label: "Só a comanda" },
  { value: "cartao", label: "Só o cartão" },
] as const;

type PrintOption = (typeof PRINT_OPTIONS)[number]["value"];

function parseOption(value: string | string[] | undefined): PrintOption {
  return PRINT_OPTIONS.some((option) => option.value === value) ? (value as PrintOption) : "tudo";
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/**
 * Comanda da cozinha e cartão de agradecimento para ir junto na embalagem. A tela mostra os
 * controles; na impressão só sobra o papel (o layout do admin esconde a barra lateral).
 */
export default async function PrintOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePagePermission("orders:view");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const option = parseOption(query.imprimir);

  const [order, contact] = await Promise.all([
    adminGetOrderById(id).catch((error) => {
      if (error instanceof AppError) notFound();
      throw error;
    }),
    getStoreContact(),
  ]);

  const firstName = order.user.name.trim().split(/\s+/)[0];
  const isDelivery = order.deliveryType === "DELIVERY";
  const showTicket = option !== "cartao";
  const showCard = option !== "comanda";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 print:max-w-none print:space-y-0 print:p-0 print:text-black">
      <div className="space-y-4 print:hidden">
        <Link
          href={`/admin/pedidos/${order.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pedido #{order.orderNumber}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="O que imprimir" className="flex flex-wrap gap-2">
            {PRINT_OPTIONS.map((item) => (
              <Link
                key={item.value}
                href={`?imprimir=${item.value}`}
                aria-current={item.value === option ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  item.value === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <PrintButton />
        </div>
        <p className="text-xs text-muted-foreground">
          Dica: o cartão sai numa folha separada — dá para recortar na linha tracejada.
        </p>
      </div>

      {showTicket && (
        <section
          aria-label="Comanda"
          className="space-y-5 rounded-xl border border-border bg-card p-6 font-mono text-sm print:rounded-none print:border-0 print:bg-transparent print:p-0"
        >
          <header className="flex items-start justify-between gap-4 border-b border-dashed border-current pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest">{contact.storeName}</p>
              <h1 className="text-2xl font-bold">Pedido #{order.orderNumber}</h1>
              <p>{dateTime.format(order.createdAt)}</p>
            </div>
            <p className="rounded border-2 border-current px-2 py-1 text-base font-bold uppercase">
              {isDelivery ? "Entrega" : "Retirada"}
            </p>
          </header>

          {order.scheduledFor && (
            <p className="rounded border-2 border-current p-2 text-center text-base font-bold first-letter:uppercase">
              {formatScheduledFor(order.scheduledFor)}
            </p>
          )}

          <div className="space-y-1">
            <p className="font-bold">{order.user.name}</p>
            {order.user.phone && <p>{order.user.phone}</p>}
            {isDelivery && (
              <p>
                {order.deliveryStreet}, {order.deliveryNumber}
                {order.deliveryComplement ? ` — ${order.deliveryComplement}` : ""}
                <br />
                {order.deliveryNeighborhood}, {order.deliveryCity}/{order.deliveryState}
                {order.deliveryReference && (
                  <>
                    <br />
                    Ref.: {order.deliveryReference}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Caixinhas para a cozinha ir marcando o que já separou. */}
          <ul className="space-y-2 border-y border-dashed border-current py-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 size-4 shrink-0 border-2 border-current" />
                <span className="flex-1">
                  <span className="font-bold">{item.quantity}x</span> {item.productNameSnapshot}
                  <span className="block text-xs">{item.variantLabelSnapshot}</span>
                  {item.note && (
                    <span className="mt-0.5 block border-l-4 border-current pl-2 font-bold">
                      Escrever: &ldquo;{item.note}&rdquo;
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {order.notes && (
            <div className="rounded border-2 border-current p-3">
              <p className="text-xs font-bold uppercase">Observações</p>
              <p className="whitespace-pre-line text-base">{order.notes}</p>
            </div>
          )}

          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(order.subtotal.toString())}</dd>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between">
                <dt>Desconto{order.couponCodeSnapshot ? ` (${order.couponCodeSnapshot})` : ""}</dt>
                <dd>-{formatCurrency(order.discountAmount.toString())}</dd>
              </div>
            )}
            {isDelivery && (
              <div className="flex justify-between">
                <dt>Entrega</dt>
                <dd>{formatCurrency(order.deliveryFee.toString())}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total.toString())}</dd>
            </div>
          </dl>

          <p className="border-t border-dashed border-current pt-3">
            Pagamento: {PAYMENT_LABELS[order.payment?.method ?? ""] ?? order.payment?.method}
            {" — "}
            <span className="font-bold">
              {PAYMENT_STATUS_LABELS[order.payment?.status ?? ""] ?? order.payment?.status}
            </span>
          </p>
        </section>
      )}

      {showCard && (
        <section
          aria-label="Cartão de agradecimento"
          className={cn(
            // Folha própria na impressão; a borda tracejada é a linha de recorte (~A6).
            "mx-auto flex w-full max-w-[105mm] flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-8 text-center print:rounded-none print:border-gray-400 print:bg-transparent",
            showTicket && "print:break-before-page",
          )}
        >
          <Image src="/branding/19_tag_obrigada.png" alt="" width={120} height={160} />
          <p className="font-display text-3xl text-script print:text-black">
            Obrigada, {firstName}!
          </p>
          <p className="text-sm leading-relaxed">
            Cada doce deste pedido foi feito com carinho, especialmente para você. Esperamos que
            ele deixe o seu dia um pouquinho mais doce.
          </p>
          <p className="text-sm">
            Conta pra gente o que achou em <span className="font-medium">{SITE_URL.host}</span>
            {contact.instagram && (
              <>
                {" "}
                ou no Instagram <span className="font-medium">@{contact.instagram.handle}</span>
              </>
            )}
            .
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground print:text-black">
            <Image src="/branding/10_coracao_patinha.png" alt="" width={18} height={18} />
            Pedido #{order.orderNumber} · {contact.storeName}
          </div>
        </section>
      )}
    </div>
  );
}
