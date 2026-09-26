"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CakeSlice,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TicketPercent,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { logoutUser } from "@/actions/auth";
import { ROLE_LABELS, adminHomePath, can, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { href: string; label: string; icon: LucideIcon; permission: Permission };

// Cada área aparece só para quem pode vê-la; a página confere de novo (requirePagePermission).
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operação",
    items: [
      { href: "/admin", label: "Visão geral", icon: LayoutDashboard, permission: "dashboard:view" },
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, permission: "orders:view" },
      { href: "/admin/avaliacoes", label: "Avaliações", icon: Star, permission: "reviews:view" },
      { href: "/admin/clientes", label: "Clientes", icon: Users, permission: "customers:view" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/produtos", label: "Produtos", icon: CakeSlice, permission: "products:view" },
      { href: "/admin/categorias", label: "Categorias", icon: Tags, permission: "categories:view" },
      { href: "/admin/cupons", label: "Cupons", icon: TicketPercent, permission: "coupons:view" },
    ],
  },
  {
    label: "Loja",
    items: [
      {
        href: "/admin/configuracoes",
        label: "Configurações",
        icon: Settings,
        permission: "settings:manage",
      },
      { href: "/admin/equipe", label: "Equipe", icon: UserCog, permission: "team:manage" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  // A visão geral é a raiz do painel: só fica ativa na própria página.
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = { role: Role; name: string };

function SidebarContent({ role, name, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-0.5 px-4 py-5">
        <Logo href={adminHomePath(role)} />
        <p className="pl-1 text-xs text-muted-foreground">Painel administrativo</p>
      </div>

      <nav aria-label="Painel administrativo" className="flex-1 space-y-5 overflow-y-auto px-3">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-link")} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-1">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground"
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/" onClick={onNavigate} />}
          >
            <Store /> Ver loja
          </Button>
          <form action={logoutUser}>
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              <LogOut /> Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Barra lateral fixa do desktop. */
export function AdminSidebar(props: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <SidebarContent {...props} />
    </aside>
  );
}

/** Barra do topo no celular, com a mesma navegação numa gaveta lateral. */
export function AdminMobileHeader(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-2 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menu do painel" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          <SidebarContent {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Logo href={adminHomePath(props.role)} />
    </header>
  );
}
