"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { logoutUser } from "@/actions/auth";
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
  roleLabel,
  adminHref,
}: {
  name: string;
  /** Nível na equipe; ausente para clientes. */
  roleLabel?: string;
  /** Página inicial do painel; ausente para clientes. */
  adminHref?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Minha conta" />}
      >
        <User className="h-5 w-5" />
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
        <DropdownMenuItem onClick={() => logoutUser()}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
