"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MapPin, Package, UserCog } from "lucide-react";
import { isActivePath } from "@/components/shared/nav-links";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/conta", label: "Visão geral", icon: LayoutGrid },
  { href: "/conta/pedidos", label: "Pedidos", icon: Package },
  { href: "/conta/enderecos", label: "Endereços", icon: MapPin },
  { href: "/conta/dados", label: "Dados e senha", icon: UserCog },
];

/** Abas da área do cliente. O detalhe de um pedido mantém "Pedidos" ativa. */
export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Minha conta"
      // No celular as abas rolam de lado em vez de quebrar linha.
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          // "/conta" é prefixo de todas as outras: só fica ativa na própria página.
          const active = href === "/conta" ? pathname === href : isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
