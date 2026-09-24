"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = { id: string; label: string };

/**
 * Indicador de etapas do checkout, fixo abaixo do header. O checkout é um formulário
 * de página única: cada `step.id` marca o início de uma etapa, a atual é a última cujo
 * início já passou do meio da tela, as anteriores aparecem como concluídas e cada
 * etapa é um atalho para a sua seção.
 */
export function CheckoutSteps({ steps }: { steps: CheckoutStep[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function update() {
      // A última etapa é curta e pode nunca chegar ao meio da tela — no fim da página, ela é a atual.
      // Exige `scrollY > 0`: numa página que cabe inteira na tela, abrir não é "ter chegado ao fim".
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActiveIndex(steps.length - 1);
        return;
      }

      const middle = window.innerHeight / 2;
      let current = 0;
      steps.forEach((step, index) => {
        const start = document.getElementById(step.id);
        if (start && start.getBoundingClientRect().top <= middle) current = index;
      });
      setActiveIndex(current);
    }

    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [steps]);

  return (
    <nav
      aria-label="Etapas do pedido"
      className="sticky top-16 z-30 -mx-4 bg-background/85 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/70"
    >
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "current" : "upcoming";
          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <a
                href={`#${step.id}`}
                aria-current={state === "current" ? "step" : undefined}
                className="flex items-center gap-2 rounded-full text-xs font-medium sm:text-sm"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs transition-colors",
                    state === "done" && "bg-primary text-primary-foreground",
                    state === "current" && "bg-secondary text-secondary-foreground ring-4 ring-secondary/60",
                    state === "upcoming" && "bg-muted text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {/* No celular só a etapa atual mostra o nome, para caber numa linha. */}
                <span
                  className={cn(
                    state === "current" ? "inline" : "sr-only sm:not-sr-only",
                    state === "upcoming" && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </a>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                    index < activeIndex ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
