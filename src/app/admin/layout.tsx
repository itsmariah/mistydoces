import type { ReactNode } from "react";
import Link from "next/link";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";

// Shell mínimo do painel administrativo — a navegação completa (produtos,
// categorias, pedidos, clientes) fica para a Fase 6. Por ora só hospeda a
// tela de configurações da loja.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/admin" className="font-heading text-lg font-semibold">
          Painel administrativo
        </Link>
        <form action={logoutUser}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
