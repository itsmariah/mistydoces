"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartSheet() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, isOpen, setOpen } =
    useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
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
        <ShoppingBag className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            <Image
              src="/branding/02_gatinha_dormindo.png"
              alt=""
              width={140}
              height={115}
            />
            <p className="text-sm text-muted-foreground">
              Seu carrinho está vazio. Que tal dar uma olhada no cardápio?
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-3 border-b border-border pb-4 last:border-0"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ProductPlaceholderImage className="object-contain p-1" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.variantLabel}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      aria-label="Diminuir quantidade"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      aria-label="Aumentar quantidade"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    aria-label="Remover item"
                    onClick={() => removeItem(item.variantId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-link">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span className="text-lg font-semibold text-link">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full"
              nativeButton={false}
              render={<Link href="/checkout" onClick={() => setOpen(false)} />}
            >
              Finalizar pedido
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
