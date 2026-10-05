"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { setFavorite, syncGuestFavorites } from "@/actions/favorites";
import { toggleFavoriteId } from "@/lib/favorites";

type FavoritesContextValue = {
  count: number;
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string, productName: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Favoritos da loja. A lista inicial vem do servidor (conta ou cookie), então os corações
 * já chegam marcados, sem piscar. Marcar/desmarcar é otimista: muda na hora e desfaz se
 * o servidor recusar.
 */
export function FavoritesProvider({
  initialIds,
  pendingGuestIds,
  children,
}: {
  initialIds: string[];
  /** Favoritos de visitante a levar para a conta (logo depois do login). */
  pendingGuestIds: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState(initialIds);
  const [prevInitial, setPrevInitial] = useState(initialIds);
  const syncStarted = useRef(false);

  // Navegar/atualizar traz a lista nova do servidor (ex.: depois de entrar na conta).
  if (initialIds !== prevInitial) {
    setPrevInitial(initialIds);
    setIds(initialIds);
  }

  useEffect(() => {
    if (pendingGuestIds.length === 0 || syncStarted.current) return;
    syncStarted.current = true;
    void syncGuestFavorites();
  }, [pendingGuestIds]);

  function toggle(productId: string, productName: string) {
    const favorite = !ids.includes(productId);
    setIds((current) => toggleFavoriteId(current, productId, favorite));

    void setFavorite({ productId, favorite }).then((result) => {
      if (!result.success) {
        setIds((current) => toggleFavoriteId(current, productId, !favorite));
        toast.error("Não foi possível salvar o favorito. Tente de novo.");
        return;
      }
      // Na própria lista de favoritos, quem foi desmarcado sai da grade.
      if (pathname === "/favoritos") router.refresh();
    });

    if (favorite && pathname !== "/favoritos") {
      toast.success(`${productName} salvo nos favoritos`, {
        action: { label: "Ver favoritos", onClick: () => router.push("/favoritos") },
      });
    }
  }

  return (
    <FavoritesContext.Provider
      value={{ count: ids.length, isFavorite: (id) => ids.includes(id), toggle }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de <FavoritesProvider>.");
  return ctx;
}
