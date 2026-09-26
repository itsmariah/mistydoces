import type { ReactNode } from "react";
import Link from "next/link";
import { logoutUser } from "@/actions/auth";
import { auth } from "@/lib/auth";
import { adminHomePath, can, type Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

// Cada área aparece só para quem pode vê-la; a página confere de novo (requirePagePermission).
const NAV_ITEMS: { href: string; label: string; permission: Permission }[] = [
  { href: "/admin", label: "Visão geral", permission: "dashboard:view" },
  { href: "/admin/produtos", label: "Produtos", permission: "products:view" },
  { href: "/admin/categorias", label: "Categorias", permission: "categories:view" },
  { href: "/admin/cupons", label: "Cupons", permission: "coupons:view" },
  { href: "/admin/pedidos", label: "Pedidos", permission: "orders:view" },
  { href: "/admin/avaliacoes", label: "Avaliações", permission: "reviews:view" },
  { href: "/admin/clientes", label: "Clientes", permission: "customers:view" },
  { href: "/admin/equipe", label: "Equipe", permission: "team:manage" },
  { href: "/admin/configuracoes", label: "Configurações", permission: "settings:manage" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const role = session?.user.role;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={adminHomePath(role)} className="font-heading text-lg font-semibold">
            Painel administrativo
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {NAV_ITEMS.filter((item) => can(role, item.permission)).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
            Ver loja
          </Button>
          <form action={logoutUser}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
