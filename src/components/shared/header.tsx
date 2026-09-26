import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { ROLE_LABELS, adminHomePath, isStaff } from "@/lib/permissions";
import { CartSheet } from "@/components/cart/cart-sheet";
import { AccountMenu } from "@/components/shared/account-menu";
import { Logo } from "@/components/shared/logo";
import { MobileNav } from "@/components/shared/mobile-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/cardapio", label: "Cardápio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const staff = isStaff(user?.role);

  return (
    <>
      {/* Faixa da equipe: deixa claro que a pessoa está vendo a loja e é o atalho de volta ao painel. */}
      {user && staff && (
        <div className="bg-muted text-xs text-muted-foreground">
          <div className="mx-auto flex h-8 max-w-6xl items-center justify-between gap-3 px-4">
            <span className="truncate">
              Você está vendo a loja · {ROLE_LABELS[user.role]}
            </span>
            <Link
              href={adminHomePath(user.role)}
              className="flex shrink-0 items-center gap-1 font-medium text-link hover:underline"
            >
              Ir para o painel <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileNav />
            </div>
            <Logo />
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <CartSheet />
            {user ? (
              <AccountMenu
                name={user.name ?? user.email ?? "Minha conta"}
                roleLabel={staff ? ROLE_LABELS[user.role] : undefined}
                adminHref={staff ? adminHomePath(user.role) : undefined}
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Entrar"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                <User className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
