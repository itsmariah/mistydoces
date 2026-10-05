"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CakeSlice, Heart, Home, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { isActivePath } from "@/components/shared/nav-links";
import { cn } from "@/lib/utils";

/**
 * Onde a barra some: na página do produto a barra fixa de "Adicionar" ocupa o lugar; no
 * checkout e no pagamento, menos distração perto do botão de pagar.
 */
const HIDDEN_ON = [/^\/cardapio\/[^/]+/, /^\/checkout/, /\/pagamento$/];

const ITEM_CLASS =
  "relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors";

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Barra de abas do celular (abaixo de `sm`): os atalhos de um app — início, cardápio,
 * favoritos, carrinho e conta — sempre ao alcance do polegar. A altura reservada no fim
 * da página vem do CSS (`:has([data-tab-bar])` em globals.css), sem esperar o JavaScript.
 */
export function MobileTabBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const { itemCount, setOpen } = useCart();
  const { count: favoritesCount } = useFavorites();

  if (HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  const links: { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean }[] = [
    { href: "/", label: "Início", icon: Home, exact: true },
    { href: "/cardapio", label: "Cardápio", icon: CakeSlice },
    { href: "/favoritos", label: "Favoritos", icon: Heart, badge: favoritesCount },
  ];
  const account = isLoggedIn
    ? { href: "/conta", label: "Conta" }
    : { href: "/login", label: "Entrar" };

  const renderLink = ({ href, label, icon: Icon, badge, exact }: (typeof links)[number]) => {
    const active = exact ? pathname === href : isActivePath(pathname, href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(ITEM_CLASS, active ? "text-link" : "text-muted-foreground")}
        >
          {/* Tracinho no topo: o marcador da aba atual, como no menu do desktop. */}
          {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
          <span className="relative">
            <Icon className={cn("size-5", active && "fill-primary/30")} aria-hidden="true" />
            {badge !== undefined && <Badge count={badge} />}
          </span>
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Atalhos"
      data-tab-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 sm:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {links.map(renderLink)}
        <li>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={itemCount > 0 ? `Carrinho (${itemCount} itens)` : "Carrinho"}
            className={cn(ITEM_CLASS, "w-full text-muted-foreground")}
          >
            <span className="relative">
              <ShoppingBag className="size-5" aria-hidden="true" />
              <Badge count={itemCount} />
            </span>
            Carrinho
          </button>
        </li>
        {renderLink({ ...account, icon: User })}
      </ul>
    </nav>
  );
}
