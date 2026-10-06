"use client";

import { useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Só gira o ícone depois de um clique — não na primeira pintura da página.
  const [spun, setSpun] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    const apply = () => {
      setSpun(true);
      setTheme(next);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduceMotion) {
      apply();
      return;
    }

    // O tema novo se espalha em círculo a partir do botão (ver `.theme-transition` em globals.css).
    const rect = (buttonRef.current ?? event.currentTarget).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-r", `${radius}px`);
    root.classList.add("theme-transition");

    const transition = document.startViewTransition(() => flushSync(apply));
    void transition.finished.finally(() => root.classList.remove("theme-transition"));
  }

  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro/escuro"
      onClick={toggle}
    >
      <Icon key={resolvedTheme} className={cn("h-5 w-5", spun && "animate-icon-spin-in")} />
    </Button>
  );
}
