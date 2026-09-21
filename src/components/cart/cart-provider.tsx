"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useMounted } from "@/lib/use-mounted";

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CART_STORAGE_KEY = "mistydoces-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [isOpen, setOpen] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, mounted]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (existing) {
        return current.map((line) =>
          line.variantId === item.variantId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
    setOpen(true);
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.variantId !== variantId);
      }
      return current.map((line) =>
        line.variantId === variantId ? { ...line, quantity } : line,
      );
    });
  }

  function removeItem(variantId: string) {
    setItems((current) => current.filter((line) => line.variantId !== variantId));
  }

  function clear() {
    setItems([]);
  }

  // Antes da hidratação, o servidor sempre renderizou um carrinho vazio —
  // expor os valores reais só depois de `mounted` evita divergência de hidratação.
  const visibleItems = mounted ? items : [];
  const itemCount = visibleItems.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = visibleItems.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        isOpen,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>.");
  }
  return ctx;
}
