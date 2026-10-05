import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, MapPin, Package, UserCog, type LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserOrders } from "@/services/order-service";
import { getUserAddresses } from "@/services/address-service";
import { getPendingReviewProducts } from "@/services/review-service";
import { PendingReviews } from "@/components/account/pending-reviews";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  OrderItemThumbnails,
  summarizeOrderItems,
} from "@/components/orders/order-item-thumbnails";
import { ReorderButton } from "@/components/orders/reorder-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { isFinalStatus } from "@/lib/order-status";
import { ScheduledFor } from "@/components/orders/scheduled-for";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha conta" };

const PENDING_REVIEWS_LIMIT = 3;

export default async function AccountPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [orders, addresses, pendingReviews] = await Promise.all([
    getUserOrders(userId),
    getUserAddresses(userId),
    getPendingReviewProducts(userId, PENDING_REVIEWS_LIMIT),
  ]);
  const latest = orders[0];

  const shortcuts: { href: string; icon: LucideIcon; title: string; description: string }[] = [
    {
      href: "/conta/pedidos",
      icon: Package,
      title: "Meus pedidos",
      description:
        orders.length === 0
          ? "Nenhum pedido ainda"
          : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`,
    },
    {
      href: "/conta/enderecos",
      icon: MapPin,
      title: "Endereços",
      description:
        addresses.length === 0
          ? "Nenhum salvo"
          : `${addresses.length} ${addresses.length === 1 ? "salvo" : "salvos"}`,
    },
    {
      href: "/conta/dados",
      icon: UserCog,
      title: "Dados e senha",
      description: "Nome, telefone e segurança",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="sr-only">Minha conta</h1>

      <section aria-labelledby="ultimo-pedido-titulo" className="space-y-3">
        <h2 id="ultimo-pedido-titulo" className="font-heading text-lg font-medium">
          Seu último pedido
        </h2>

        {latest ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">Pedido #{latest.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(latest.createdAt)}
                </p>
              </div>
              <OrderStatusBadge status={latest.status} />
            </div>

            {/* A data só ajuda enquanto o pedido ainda vai acontecer. */}
            {!isFinalStatus(latest.status) && (
              <ScheduledFor
                scheduledFor={latest.scheduledFor}
                deliveryType={latest.deliveryType}
                className="p-3"
              />
            )}

            <div className="flex items-center gap-3">
              <OrderItemThumbnails
                images={latest.items.map((item) => item.variant.product.imageUrl)}
              />
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                {summarizeOrderItems(latest.items.map((item) => item.productNameSnapshot))}
              </p>
              <span className="shrink-0 font-semibold text-link">
                {formatCurrency(latest.total.toString())}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href={`/conta/pedidos/${latest.id}`} />}>
                {isFinalStatus(latest.status) ? "Ver detalhes" : "Acompanhar pedido"}
              </Button>
              {/* Repetir só faz sentido depois que o pedido terminou. */}
              {isFinalStatus(latest.status) && (
                <ReorderButton
                  lines={latest.items.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    productName: item.productNameSnapshot,
                    note: item.note,
                  }))}
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            image={{ src: "/branding/14_pote_de_biscoitos.png", width: 120, height: 125 }}
            title="Nenhum pedido ainda"
            description="Quando você fizer seu primeiro pedido, ele aparece aqui para você acompanhar."
            action={
              <Button nativeButton={false} render={<Link href="/cardapio" />}>
                Ver cardápio
              </Button>
            }
            className="rounded-2xl border border-border py-8"
          />
        )}
      </section>

      <PendingReviews products={pendingReviews.products} total={pendingReviews.total} />

      <ul className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, icon: Icon, title, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
