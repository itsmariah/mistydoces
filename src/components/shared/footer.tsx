import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/shared/instagram-icon";
import { Logo } from "@/components/shared/logo";
import { getStoreContact } from "@/services/store-settings-service";

const SOCIAL_LINK_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground";

export async function Footer() {
  const contact = await getStoreContact();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {contact.description ?? "Doces artesanais feitos com carinho, do pedido à entrega."}
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
          <Link href="/duvidas" className="text-muted-foreground hover:text-foreground">
            Dúvidas frequentes
          </Link>
        </nav>

        {/* Só mostra os canais preenchidos no painel — nada de link apontando para "#". */}
        {(contact.whatsappHref || contact.instagram) && (
          <div className="flex gap-3">
            {contact.whatsappHref && (
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={SOCIAL_LINK_CLASS}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {contact.instagram && (
              <a
                href={contact.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram (@${contact.instagram.handle})`}
                className={SOCIAL_LINK_CLASS}
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {contact.storeName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
