import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/shared/logo";

/** lucide-react não inclui ícones de marca (ex.: Instagram) — SVG minimalista próprio. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Doces artesanais feitos com carinho, do pedido à entrega.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/cardapio" className="text-muted-foreground hover:text-foreground">
            Cardápio
          </Link>
          <Link href="/sobre" className="text-muted-foreground hover:text-foreground">
            Sobre
          </Link>
          <Link href="/contato" className="text-muted-foreground hover:text-foreground">
            Contato
          </Link>
        </nav>

        <div className="flex gap-3">
          <a
            href="#"
            aria-label="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MistyDoces. Todos os direitos reservados.
      </div>
    </footer>
  );
}
