import { Bike, CreditCard, ShoppingBag, type LucideIcon } from "lucide-react";
import { Wave } from "@/components/home/section-dividers";

const STEPS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: ShoppingBag,
    title: "Escolha seus doces",
    description: "Monte seu pedido pelo cardápio, com o tamanho e a quantidade que quiser.",
  },
  {
    icon: CreditCard,
    title: "Faça o pedido",
    description: "Pague online com Pix ou cartão, ou na hora de receber.",
  },
  {
    icon: Bike,
    title: "Receba ou retire",
    description: "Levamos até você ou você busca com a gente. É só acompanhar o status pelo site.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona-titulo">
      <Wave className="text-accent/40 dark:text-secondary/35" />
      <div className="bg-accent/40 py-12 sm:py-16 dark:bg-secondary/35">
        <div className="mx-auto max-w-5xl space-y-10 px-4">
          <div className="text-center">
            <p className="font-display text-xl text-script">simples assim</p>
            <h2 id="como-funciona-titulo" className="font-heading text-2xl font-semibold">
              Como funciona
            </h2>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="flex flex-col items-center gap-3 text-center">
                <span className="relative flex size-14 items-center justify-center rounded-full bg-background text-link shadow-sm dark:bg-accent">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground dark:bg-script dark:text-background"
                  >
                    {index + 1}
                  </span>
                </span>
                <h3 className="font-heading text-lg font-semibold">{title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Wave flip className="text-accent/40 dark:text-secondary/35" />
    </section>
  );
}
