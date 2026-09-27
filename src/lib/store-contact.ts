import { whatsappUrl } from "@/lib/whatsapp";

/** Nome usado enquanto a loja não salvou as configurações pela primeira vez. */
export const DEFAULT_STORE_NAME = "MistyDoces";

type StoreSettingsLike = {
  storeName: string;
  description: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  openingHours: string | null;
};

export type PickupInfo = {
  /** Endereço em até duas linhas: rua / cidade-UF e CEP. */
  addressLines: string[];
  mapsHref: string;
  openingHours: string | null;
};

export type StoreContact = {
  storeName: string;
  description: string | null;
  whatsappHref: string | null;
  phone: { display: string; href: string } | null;
  email: { display: string; href: string } | null;
  instagram: { handle: string; href: string } | null;
  pickup: PickupInfo | null;
  openingHours: string | null;
  /** Algum canal para falar com a loja (WhatsApp, telefone, e-mail ou Instagram). */
  hasChannels: boolean;
};

function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) return `tel:+55${digits}`;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `tel:+${digits}`;
  }
  // Número em formato inesperado (ex.: 0800): liga com os dígitos como estão.
  return digits.length >= 8 ? `tel:${digits}` : null;
}

function buildPickup(settings: StoreSettingsLike): PickupInfo | null {
  if (!settings.street) return null;

  const cityLine = [
    [settings.city, settings.state].filter(Boolean).join("/"),
    settings.zipCode && `CEP ${settings.zipCode}`,
  ]
    .filter(Boolean)
    .join(" — ");
  const addressLines = [settings.street, cityLine].filter(Boolean);
  const query = [settings.street, settings.city, settings.state, settings.zipCode]
    .filter(Boolean)
    .join(", ");

  return {
    addressLines,
    mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    openingHours: settings.openingHours,
  };
}

/** Dados de contato prontos para a loja exibir, com os links já montados. */
export function buildStoreContact(settings: StoreSettingsLike | null): StoreContact {
  if (!settings) {
    return {
      storeName: DEFAULT_STORE_NAME,
      description: null,
      whatsappHref: null,
      phone: null,
      email: null,
      instagram: null,
      pickup: null,
      openingHours: null,
      hasChannels: false,
    };
  }

  const whatsappHref = settings.whatsapp
    ? whatsappUrl(settings.whatsapp, `Olá! Vim pelo site da ${settings.storeName}.`)
    : null;
  const phoneHref = settings.phone ? telHref(settings.phone) : null;
  const phone = settings.phone && phoneHref ? { display: settings.phone, href: phoneHref } : null;
  const email = settings.email
    ? { display: settings.email, href: `mailto:${settings.email}` }
    : null;
  const instagram = settings.instagram
    ? { handle: settings.instagram, href: `https://instagram.com/${settings.instagram}` }
    : null;

  return {
    storeName: settings.storeName,
    description: settings.description,
    whatsappHref,
    phone,
    email,
    instagram,
    pickup: buildPickup(settings),
    openingHours: settings.openingHours,
    hasChannels: Boolean(whatsappHref || phone || email || instagram),
  };
}
