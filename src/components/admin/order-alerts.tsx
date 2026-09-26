"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getOrderAlerts } from "@/actions/admin-orders";
import { playChime, unlockChime } from "@/lib/chime";

/** Pedido novo precisa aparecer rápido, mas sem martelar o servidor. */
const POLL_INTERVAL_MS = 20_000;

type OrderAlertsState = {
  pendingCount: number;
  latestOrder: { id: string; orderNumber: number } | null;
};

const PendingCountContext = createContext(0);

/** Quantos pedidos aguardam confirmação — usado no contador da barra lateral. */
export function usePendingOrdersCount() {
  return use(PendingCountContext);
}

/**
 * Consulta periodicamente os pedidos do painel: quando chega um pedido novo, avisa
 * com toast + som e atualiza a página se ela lista pedidos. Pausa com a aba em
 * segundo plano e confere assim que a pessoa volta para ela.
 */
export function OrderAlertsProvider({
  initial,
  children,
}: {
  initial: OrderAlertsState;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(initial.pendingCount);
  const lastSeenNumber = useRef(initial.latestOrder?.orderNumber ?? 0);

  // Ações do painel (confirmar, cancelar…) fazem router.refresh(), que re-renderiza o
  // layout com números novos: o contador acompanha na hora, sem esperar a próxima consulta.
  const [prevInitialPending, setPrevInitialPending] = useState(initial.pendingCount);
  if (initial.pendingCount !== prevInitialPending) {
    setPrevInitialPending(initial.pendingCount);
    setPendingCount(initial.pendingCount);
  }
  // Lido dentro do intervalo sem reiniciá-lo a cada navegação.
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // O primeiro clique ou tecla libera o som (regra de autoplay dos navegadores).
    window.addEventListener("pointerdown", unlockChime, { once: true });
    window.addEventListener("keydown", unlockChime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockChime);
      window.removeEventListener("keydown", unlockChime);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible") return;
      const result = await getOrderAlerts();
      if (cancelled || !result.success) return;

      const { pendingCount: nextPending, latestOrder } = result.data;
      setPendingCount(nextPending);

      if (latestOrder && latestOrder.orderNumber > lastSeenNumber.current) {
        const newCount = latestOrder.orderNumber - lastSeenNumber.current;
        lastSeenNumber.current = latestOrder.orderNumber;

        toast(newCount === 1 ? `Novo pedido #${latestOrder.orderNumber}!` : `${newCount} novos pedidos!`, {
          action: {
            label: "Ver",
            onClick: () =>
              router.push(newCount === 1 ? `/admin/pedidos/${latestOrder.id}` : "/admin/pedidos"),
          },
        });
        playChime();

        const current = pathnameRef.current;
        if (current === "/admin" || current === "/admin/pedidos") router.refresh();
      }
    }

    const interval = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return <PendingCountContext value={pendingCount}>{children}</PendingCountContext>;
}
