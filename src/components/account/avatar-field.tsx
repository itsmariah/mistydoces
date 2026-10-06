"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateAvatar } from "@/actions/profile";
import { uploadToCloudinary } from "@/lib/upload-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

/** Foto de celular passa fácil de 5 MB; acima de 10 MB é provável que seja engano (vídeo, RAW…). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Foto de perfil: envia direto ao Cloudinary e salva o link. O recorte é automático
 * (quadrado centrado no rosto, ver `avatarImageUrl`) — não há tela de recorte.
 */
export function AvatarField({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const busy = isUploading || isSaving;

  function save(url: string | null, successMessage: string) {
    startTransition(async () => {
      const result = await updateAvatar(url);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(successMessage);
      // Cabeçalho e demais lugares com a foto vêm do servidor.
      router.refresh();
    });
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Limpa já: escolher o mesmo arquivo de novo precisa disparar o `change`.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem (JPG, PNG…).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Essa imagem é muito grande. Escolha uma de até 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "avatar");
      save(url, "Foto de perfil atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative">
        <UserAvatar name={name} avatarUrl={avatarUrl} size={80} />
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="size-6 animate-spin text-link" aria-label="Salvando foto" />
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Camera /> {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => save(null, "Foto de perfil removida.")}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 /> Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          A foto é recortada em círculo automaticamente, centralizada no rosto.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
