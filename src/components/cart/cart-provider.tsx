"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { refreshCart } from "@/actions/cart";
import {
  cartLineKey,
  normalizeNote,
  parseStoredCart,
  reconcileCart,
  serializeCart,
  type CartItem,
  type CartReconciliation,
} from "@/lib/cart";
import { useMounted } from "@/lib/use-mounted";
import { formatCurrency } from "@/lib/utils";
import { MAX_ITEM_QUANTITY } from "@/validations/order";

export type { CartItem } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** Soma só os itens disponíveis — os indisponíveis não podem ser comprados. */
  subtotal: number;
  hasUnavailable: boolean;
  /** Por padrão abre a gaveta do carrinho; `openCart: false` é para adicionar sem tirar a pessoa da página. */
  addItem: (
    item: Omit<CartItem, "quantity" | "isAvailable" | "note"> & { note?: string },
    quantity?: number,
    options?: { openCart?: boolean },
  ) => void;
  /** `lineKey` vem de `cartLineKey(item)`: variação + personalização. */
  updateQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  /** Recoloca um item removido na mesma posição — usado pelo "Desfazer" do toast. */
  restoreItem: (item: CartItem, index: number) => void;
  clear: () => void;
  /** Confere preço, nome, foto e disponibilidade no servidor e avisa o que mudou. */
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CART_STORAGE_KEY = "mistydoces-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** `"A"` · `"A" e "B"` · `"A", "B" e "C"` */
function listNames(items: CartItem[]): string {
  const names = [...new Set(items.map((item) => `"${item.productName}"`))];
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

function notifyChanges({ removed, priceChanged, becameUnavailable }: CartReconciliation) {
  if (removed.length > 0) {
    toast.warning(`${listNames(removed)} saiu do cardápio e foi removido do carrinho.`);
  }
  if (becameUnavailable.length > 0) {
    toast.warning(`${listNames(becameUnavailable)} está indisponível no momento.`, {
      description: "Remova do carrinho para finalizar o pedido.",
    });
  }
  if (priceChanged.length === 1) {
    const [{ item, previousPrice }] = priceChanged;
    toast.info(`O preço de "${item.productName}" mudou.`, {
      description: `${item.variantLabel}: de ${formatCurrency(previousPrice)} para ${formatCurrency(item.price)}.`,
    });
  } else if (priceChanged.length > 1) {
    toast.info("Alguns preços do seu carrinho mudaram.", {
      description: "O subtotal já está com os valores atualizados.",
    });
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [isOpen, setOpen] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const mounted = useMounted();

  // A conferência é assíncrona: o ref dá acesso ao carrinho mais recente quando a resposta chega.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(items));
    } catch {
      // Modo privado ou armazenamento cheio: o carrinho segue funcionando só nesta aba.
    }
  }, [items, mounted]);

  const refresh = useCallback(async () => {
    const requestedIds = itemsRef.current.map((item) => item.variantId);
    if (requestedIds.length === 0) return;

    setRefreshing(true);
    try {
      const result = await refreshCart(requestedIds);
      // Falha na conferência não bloqueia nada: o checkout revalida tudo de qualquer forma.
      if (!result.success) return;

      notifyChanges(reconcileCart(itemsRef.current, result.data, requestedIds));
      setItems((current) => reconcileCart(current, result.data, requestedIds).items);
    } catch {
      // Sem conexão: mantém o carrinho como está.
    } finally {
      setRefreshing(false);
    }
  }, []);

  function addItem(
    item: Omit<CartItem, "quantity" | "isAvailable" | "note"> & { note?: string },
    quantity = 1,
    { openCart = true }: { openCart?: boolean } = {},
  ) {
    const line: Omit<CartItem, "quantity" | "isAvailable"> = {
      ...item,
      note: normalizeNote(item.note ?? ""),
    };
    const key = cartLineKey(line);
    setItems((current) => {
      const existing = current.find((entry) => cartLineKey(entry) === key);
      if (existing) {
        return current.map((entry) =>
          cartLineKey(entry) === key
            ? { ...entry, quantity: Math.min(entry.quantity + quantity, MAX_ITEM_QUANTITY) }
            : entry,
        );
      }
      // Quem adiciona está vendo o produto à venda agora, então entra como disponível.
      return [
        ...current,
        { ...line, isAvailable: true, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) },
      ];
    });
    if (openCart) setOpen(true);
  }

  function updateQuantity(lineKey: string, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((line) => cartLineKey(line) !== lineKey);
      }
      return current.map((line) =>
        cartLineKey(line) === lineKey
          ? { ...line, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }
          : line,
      );
    });
  }

  function removeItem(lineKey: string) {
    setItems((current) => current.filter((line) => cartLineKey(line) !== lineKey));
  }

  function restoreItem(item: CartItem, index: number) {
    setItems((current) => {
      if (current.some((line) => cartLineKey(line) === cartLineKey(item))) return current;
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
  }

  function clear() {
    setItems([]);
    // Apaga já, sem esperar o efeito: no logout a navegação pode vir antes do próximo render.
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignora — o efeito de persistência grava o carrinho vazio em seguida
    }
  }

  // Antes da hidratação, o servidor sempre renderizou um carrinho vazio —
  // expor os valores reais só depois de `mounted` evita divergência de hidratação.
  const visibleItems = mounted ? items : [];
  const itemCount = visibleItems.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = visibleItems.reduce(
    (sum, line) => (line.isAvailable ? sum + line.price * line.quantity : sum),
    0,
  );
  const hasUnavailable = visibleItems.some((line) => !line.isAvailable);

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        itemCount,
        subtotal,
        hasUnavailable,
        addItem,
        updateQuantity,
        removeItem,
        restoreItem,
        clear,
        refresh,
        isRefreshing,
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
