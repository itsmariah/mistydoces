"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { EmptyState } from "@/components/shared/empty-state";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { useMounted } from "@/lib/use-mounted";
import { formatLeadTimeLong, maxLeadTimeDays } from "@/lib/scheduling";
import { cn, formatCurrency } from "@/lib/utils";
import { MAX_ITEM_QUANTITY } from "@/validations/order";

export function CartSheet() {
  const {
    items,
    itemCount,
    subtotal,
    hasUnavailable,
    updateQuantity,
    removeItem,
    restoreItem,
    refresh,
    isOpen,
    setOpen,
  } = useCart();

  // O ícone "pula" quando a quantidade de itens sobe (adicionar, pedir de novo, desfazer
  // remoção). Ajuste durante a renderização, sem efeito: é o padrão do React para reagir
  // a uma mudança de valor. Trocar a `key` remonta o ícone e reinicia a animação.
  // Antes da hidratação o carrinho aparece vazio: o primeiro valor real é só a referência,
  // senão o ícone pularia em todo carregamento de página com itens salvos.
  const mounted = useMounted();
  const [previousCount, setPreviousCount] = useState<number | null>(null);
  const [bumpKey, setBumpKey] = useState(0);
  if (mounted && itemCount !== previousCount) {
    if (previousCount !== null && itemCount > previousCount) setBumpKey((key) => key + 1);
    setPreviousCount(itemCount);
  }

  // Confere preços e disponibilidade toda vez que a pessoa abre o carrinho. Ao adicionar
  // um item a gaveta abre por `addItem`, sem passar por aqui — o item acabou de vir da página.
  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (open) void refresh();
  }

  // Remover (pela lixeira ou diminuindo até 0) sempre oferece desfazer — é fácil tocar sem querer no celular.
  function handleRemove(item: CartItem, index: number) {
    removeItem(item.variantId);
    toast(`${item.productName} removido do carrinho`, {
      description: item.variantLabel,
      action: { label: "Desfazer", onClick: () => restoreItem(item, index) },
    });
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Carrinho"
            className="relative"
          />
        }
      >
        <span key={bumpKey} className={cn("relative flex", bumpKey > 0 && "animate-pop")}>
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyState
            image={{ src: "/branding/02_gatinha_dormindo.png", width: 140, height: 115 }}
            title="Carrinho vazio"
            description="Que tal dar uma olhada no cardápio?"
            className="py-6"
          />
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.map((item, index) => (
              <div
                key={item.variantId}
                className="flex gap-3 border-b border-border pb-4 last:border-0"
              >
                <div
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted",
                    !item.isAvailable && "opacity-50 grayscale",
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <ProductPlaceholderImage className="object-contain p-1" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.variantLabel}
                  </span>
                  <div className="mt-1">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(quantity) =>
                        quantity === 0
                          ? handleRemove(item, index)
                          : updateQuantity(item.variantId, quantity)
                      }
                      min={0}
                      max={MAX_ITEM_QUANTITY}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  {/* Área de toque de 44px (margem negativa mantém o ícone alinhado). */}
                  <button
                    type="button"
                    aria-label={`Remover ${item.productName} (${item.variantLabel})`}
                    onClick={() => handleRemove(item, index)}
                    className="-m-3.5 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {item.isAvailable ? (
                    <span className="text-sm font-semibold text-link">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  ) : (
                    <Badge variant="outline">Indisponível</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter>
            {maxLeadTimeDays(items) > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs text-secondary-foreground">
                <CalendarClock className="mt-px size-4 shrink-0" aria-hidden="true" />
                {formatLeadTimeLong(maxLeadTimeDays(items))}. Você escolhe a data no próximo passo.
              </p>
            )}
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span className="text-lg font-semibold text-link">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {hasUnavailable ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Remova os itens indisponíveis para finalizar o pedido.
                </p>
                <Button size="lg" className="w-full" disabled>
                  Finalizar pedido
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="w-full"
                nativeButton={false}
                render={<Link href="/checkout" onClick={() => setOpen(false)} />}
              >
                Finalizar pedido
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Entrega ou retirada, dia e horário e forma de pagamento você escolhe no próximo passo.
            </p>
            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
              Continuar comprando
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
