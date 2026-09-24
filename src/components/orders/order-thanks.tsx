import Image from "next/image";

type OrderThanksProps = {
  title: string;
  description: string;
};

/** Bloco de agradecimento exibido logo após o pedido ser feito ou pago. */
export function OrderThanks({ title, description }: OrderThanksProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
      <Image
        src="/branding/19_tag_obrigada.png"
        alt=""
        width={96}
        height={128}
        className="shrink-0"
      />
      <div className="space-y-1">
        <p className="font-display text-3xl text-link">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
