"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { useLogout } from "@/components/shared/logout-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACCOUNT_LINKS = [
  { href: "/conta", label: "Minha conta", icon: User },
  { href: "/conta/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/conta/enderecos", label: "Endereços", icon: MapPin },
];

export function AccountMenu({
  name,
  avatarUrl,
  roleLabel,
  adminHref,
}: {
  name: string;
  avatarUrl: string | null;
  /** Nível na equipe; ausente para clientes. */
  roleLabel?: string;
  /** Página inicial do painel; ausente para clientes. */
  adminHref?: string;
}) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Minha conta" />}
      >
        {avatarUrl ? (
          <UserAvatar name={name} avatarUrl={avatarUrl} size={28} />
        ) : (
          <User className="h-5 w-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{name}</span>
            {roleLabel && <span className="block text-xs font-normal">{roleLabel}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon />
            {label}
          </DropdownMenuItem>
        ))}
        {adminHref && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={adminHref} />}>
              <LayoutDashboard />
              Painel administrativo
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
