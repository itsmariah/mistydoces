import Link from "next/link";
import { User } from "lucide-react";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { CartSheet } from "@/components/cart/cart-sheet";
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
  const accountHref = !session?.user
    ? "/login"
    : isStaff(session.user.role)
      ? "/admin"
      : "/conta";

  return (
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Minha conta"
            render={<Link href={accountHref} />}
            nativeButton={false}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
