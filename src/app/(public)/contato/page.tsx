import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getStoreContact } from "@/services/store-settings-service";
import { InstagramIcon } from "@/components/shared/instagram-icon";
import { PickupDetails } from "@/components/shared/pickup-details";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contato",
};

function ChannelLink({
  href,
  icon,
  label,
  value,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </a>
  );
}

export default async function ContatoPage() {
  const contact = await getStoreContact();

  // Nada preenchido no painel ainda: mantém o aviso de "em breve" em vez de uma página vazia.
  if (!contact.hasChannels && !contact.pickup) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
        <Image src="/branding/14_pote_de_biscoitos.png" alt="" width={160} height={168} />
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Contato</h1>
          <p className="text-muted-foreground">
            Estamos organizando nossos canais de atendimento — em breve você vai poder falar com a
            gente direto por aqui.
          </p>
        </div>
        <Button size="lg" nativeButton={false} render={<Link href="/cardapio" />}>
          Ver cardápio enquanto isso
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image src="/branding/14_pote_de_biscoitos.png" alt="" width={120} height={126} />
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Contato</h1>
          <p className="text-muted-foreground">
            Dúvidas, encomendas especiais ou só um oi — fale com a gente pelo canal que preferir.
          </p>
        </div>
        {contact.whatsappHref && (
          <Button
            size="lg"
            nativeButton={false}
            render={<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle /> Chamar no WhatsApp
          </Button>
        )}
      </div>

      {(contact.phone || contact.email || contact.instagram) && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Outros canais</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {contact.phone && (
              <ChannelLink
                href={contact.phone.href}
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={contact.phone.display}
              />
            )}
            {contact.email && (
              <ChannelLink
                href={contact.email.href}
                icon={<Mail className="h-4 w-4" />}
                label="E-mail"
                value={contact.email.display}
              />
            )}
            {contact.instagram && (
              <ChannelLink
                href={contact.instagram.href}
                icon={<InstagramIcon className="h-4 w-4" />}
                label="Instagram"
                value={`@${contact.instagram.handle}`}
                external
              />
            )}
          </div>
        </section>
      )}

      {contact.pickup && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Retirada no local</h2>
          <PickupDetails pickup={contact.pickup} className="rounded-lg border border-border p-4" />
        </section>
      )}

      {!contact.pickup && contact.openingHours && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Horário de funcionamento</h2>
          <p className="whitespace-pre-line text-sm">{contact.openingHours}</p>
        </section>
      )}
    </div>
  );
}
