"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Compartilhar o produto: no celular abre a folha nativa (WhatsApp, Instagram...);
 * onde não há Web Share (a maioria dos desktops), copia o link.
 */
export function ShareButton({ title, text }: { title: string; text: string }) {
  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // A pessoa fechou a folha de compartilhamento: nada a fazer.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!", { description: "É só colar onde quiser compartilhar." });
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleShare}>
      <Share2 />
      Compartilhar
    </Button>
  );
}
