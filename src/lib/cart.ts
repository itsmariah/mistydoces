import { z } from "zod";
import { MAX_ITEM_NOTE_LENGTH, MAX_ITEM_QUANTITY } from "@/validations/order";

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  productSlug: z.string(),
  productName: z.string(),
  variantLabel: z.string(),
  price: z.number().nonnegative(),
  imageUrl: z.string().nullable(),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
  // Carrinhos salvos antes deste campo existir contam como disponíveis até a próxima conferência.
  isAvailable: z.boolean().default(true),
  // Idem: pronta-entrega até a conferência trazer o prazo real (o servidor confere de novo).
  leadTimeDays: z.number().int().min(0).default(0),
  /** Personalização escrita pelo cliente; "" = sem personalização. */
  note: z.string().max(MAX_ITEM_NOTE_LENGTH).default(""),
});

export type CartItem = z.output<typeof cartItemSchema>;

/** Espaços nas pontas e repetidos não contam: "  Ana  " e "Ana" são a mesma personalização. */
export function normalizeNote(note: string): string {
  return note.trim().replace(/\s+/g, " ").slice(0, MAX_ITEM_NOTE_LENGTH);
}

/**
 * Identidade de uma linha do carrinho: variação + personalização. "Bolo · Ana" e
 * "Bolo · João" são linhas diferentes; o mesmo bolo sem texto soma na mesma linha.
 */
export function cartLineKey(item: { variantId: string; note: string }): string {
  return `${item.variantId}\u0000${item.note}`;
}

/** Sobe quando o formato salvo mudar de um jeito que o schema não consiga absorver. */
const CART_STORAGE_VERSION = 1;

const storedCartSchema = z.union([
  z.object({ version: z.literal(CART_STORAGE_VERSION), items: z.array(cartItemSchema) }),
  // Formato antigo (lista pura, sem versão): aproveitado para ninguém perder o carrinho no deploy.
  z.array(cartItemSchema).transform((items) => ({ version: CART_STORAGE_VERSION, items })),
]);

/** Lê o que estava no localStorage; qualquer coisa inválida vira carrinho vazio. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = storedCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.items : [];
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ version: CART_STORAGE_VERSION, items });
}

/** Dados atuais de uma variação, vindos do servidor (`refreshCart`). */
export type CartVariantSnapshot = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  /** Antecedência mínima do produto em dias (0 = pronta-entrega). */
  leadTimeDays: number;
  /** O produto aceita personalização por item. */
  allowsNote: boolean;
};

export type CartReconciliation = {
  items: CartItem[];
  /** Variações que não existem mais — saem do carrinho. */
  removed: CartItem[];
  /** Itens cujo preço mudou desde que foram adicionados (já com o preço novo). */
  priceChanged: { item: CartItem; previousPrice: number }[];
  /** Itens que acabaram de ficar indisponíveis (não estavam marcados antes). */
  becameUnavailable: CartItem[];
};

/**
 * Atualiza o carrinho com os dados do servidor. Só mexe nas variações que foram
 * consultadas (`requestedIds`): um item adicionado enquanto a consulta estava em
 * andamento não aparece na resposta, mas também não pode ser tratado como excluído.
 */
export function reconcileCart(
  items: CartItem[],
  snapshots: CartVariantSnapshot[],
  requestedIds: string[],
): CartReconciliation {
  const byId = new Map(snapshots.map((snapshot) => [snapshot.variantId, snapshot]));
  const requested = new Set(requestedIds);
  const result: CartReconciliation = {
    items: [],
    removed: [],
    priceChanged: [],
    becameUnavailable: [],
  };

  for (const item of items) {
    if (!requested.has(item.variantId)) {
      result.items.push(item);
      continue;
    }

    const snapshot = byId.get(item.variantId);
    if (!snapshot) {
      result.removed.push(item);
      continue;
    }

    const { allowsNote, ...current } = snapshot;
    // Se a loja desligou a personalização do produto, o texto sai (o servidor ignoraria).
    const updated: CartItem = { ...current, quantity: item.quantity, note: allowsNote ? item.note : "" };
    if (snapshot.price !== item.price) {
      result.priceChanged.push({ item: updated, previousPrice: item.price });
    }
    if (item.isAvailable && !snapshot.isAvailable) {
      result.becameUnavailable.push(updated);
    }
    result.items.push(updated);
  }

  result.items = mergeDuplicateLines(result.items);
  return result;
}

/** Junta linhas que ficaram iguais (ex.: duas personalizações que viraram "sem texto"). */
function mergeDuplicateLines(items: CartItem[]): CartItem[] {
  const merged: CartItem[] = [];
  const byKey = new Map<string, CartItem>();
  for (const item of items) {
    const key = cartLineKey(item);
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, MAX_ITEM_QUANTITY);
      continue;
    }
    const copy = { ...item };
    byKey.set(key, copy);
    merged.push(copy);
  }
  return merged;
}

export type ReorderLine = {
  variantId: string;
  quantity: number;
  productName: string;
  note?: string | null;
};

/**
 * "Pedir de novo": separa as linhas de um pedido antigo entre o que ainda dá para comprar
 * (com o preço de hoje, vindo do snapshot) e o que ficou de fora — saiu do cardápio ou
 * está esgotado. `skipped` traz os nomes para avisar a pessoa.
 */
export function planReorder(
  lines: ReorderLine[],
  snapshots: CartVariantSnapshot[],
): {
  toAdd: { snapshot: CartVariantSnapshot; quantity: number; note: string }[];
  skipped: string[];
} {
  const byId = new Map(snapshots.map((snapshot) => [snapshot.variantId, snapshot]));
  const toAdd: { snapshot: CartVariantSnapshot; quantity: number; note: string }[] = [];
  const skipped: string[] = [];

  for (const line of lines) {
    const snapshot = byId.get(line.variantId);
    if (snapshot?.isAvailable) {
      // A personalização volta junto, se o produto ainda aceitar.
      const note = snapshot.allowsNote ? normalizeNote(line.note ?? "") : "";
      toAdd.push({ snapshot, quantity: line.quantity, note });
    } else {
      skipped.push(snapshot?.productName ?? line.productName);
    }
  }

  return { toAdd, skipped };
}
