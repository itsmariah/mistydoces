import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { HeartsDivider } from "@/components/home/section-dividers";
import { HoursList } from "@/components/shared/hours-list";
import { InstagramIcon } from "@/components/shared/instagram-icon";
import { Logo } from "@/components/shared/logo";
import { OpenStatus } from "@/components/shared/open-status";
import { getStoreContact } from "@/services/store-settings-service";

const NAV_LINKS = [
  { href: "/cardapio", label: "Cardápio" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/conta/pedidos", label: "Meus pedidos" },
  { href: "/sobre", label: "Nossa história" },
  { href: "/duvidas", label: "Dúvidas frequentes" },
  { href: "/contato", label: "Contato" },
];

const LINK_CLASS = "text-muted-foreground transition-colors hover:text-foreground";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ChannelLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className={`group inline-flex items-center gap-2 ${LINK_CLASS}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </a>
  );
}

export async function Footer() {
  const contact = await getStoreContact();
  const hasSocial = Boolean(contact.whatsappHref || contact.instagram || contact.phone || contact.email);

  return (
    <>
      <HeartsDivider className="mb-8" />
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-24 sm:grid-cols-2 sm:pb-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:pb-12">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              {contact.description ?? "Doces artesanais feitos com carinho, do pedido à entrega."}
            </p>
          </div>

          <FooterColumn title="Navegação">
            <nav aria-label="Rodapé">
              <ul className="space-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterColumn>

          <FooterColumn title="Atendimento">
            <OpenStatus schedule={contact.schedule} className="font-medium" />
            <HoursList hours={contact.hours} className="text-sm text-muted-foreground" />
          </FooterColumn>

          <FooterColumn title="Fale com a gente">
            {/* Só mostra os canais preenchidos no painel — nada de link apontando para "#". */}
            {hasSocial ? (
              <ul className="space-y-2 text-sm">
                {contact.whatsappHref && (
                  <li>
                    <ChannelLink
                      href={contact.whatsappHref}
                      icon={<MessageCircle className="h-4 w-4" />}
                      label="WhatsApp"
                    />
                  </li>
                )}
                {contact.instagram && (
                  <li>
                    <ChannelLink
                      href={contact.instagram.href}
                      icon={<InstagramIcon className="h-4 w-4" />}
                      label={`@${contact.instagram.handle}`}
                    />
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <ChannelLink
                      href={contact.phone.href}
                      icon={<Phone className="h-4 w-4" />}
                      label={contact.phone.display}
                    />
                  </li>
                )}
                {contact.email && (
                  <li>
                    <ChannelLink
                      href={contact.email.href}
                      icon={<Mail className="h-4 w-4" />}
                      label={contact.email.display}
                    />
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nossos canais chegam em breve. Enquanto isso, veja as{" "}
                <Link href="/duvidas" className="text-link hover:underline">
                  dúvidas frequentes
                </Link>
                .
              </p>
            )}
          </FooterColumn>
        </div>

        <div className="relative border-t border-border">
          {/* A Misty cochilando "sentada" na linha do rodapé, no canto direito. */}
          <Image
            src="/branding/02_gatinha_dormindo.png"
            alt=""
            width={110}
            height={90}
            className="pointer-events-none absolute right-4 bottom-full h-auto w-22 sm:right-8 sm:w-27.5 dark:brightness-95"
          />
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
            <p>
              © {new Date().getFullYear()} {contact.storeName}. Todos os direitos reservados.
            </p>
            <p>Feito com carinho em João Pessoa 💜</p>
          </div>
        </div>
      </footer>
    </>
  );
}
