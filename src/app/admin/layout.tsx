import type { ReactNode } from "react";
import Link from "next/link";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="font-heading text-lg font-semibold">
            Painel administrativo
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
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
