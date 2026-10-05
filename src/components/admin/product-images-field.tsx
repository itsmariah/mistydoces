"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MAX_PRODUCT_IMAGES } from "@/validations/product";
import { cn } from "@/lib/utils";

type SignResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};

/** Upload assinado direto para o Cloudinary: o arquivo não passa pelo nosso servidor. */
async function uploadToCloudinary(file: File): Promise<string> {
  const signResponse = await fetch("/api/uploads/sign", { method: "POST" });
  if (!signResponse.ok) {
    const body = await signResponse.json().catch(() => null);
    throw new Error(body?.error ?? "Não foi possível preparar o upload.");
  }
  const { signature, timestamp, folder, apiKey, cloudName }: SignResponse =
    await signResponse.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  if (!uploadResponse.ok) {
    throw new Error("Falha no upload da imagem. Confira as credenciais do Cloudinary.");
  }
  const data = await uploadResponse.json();
  return data.secure_url as string;
}

const ICON_BUTTON =
  "flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background disabled:opacity-40";

/**
 * Fotos do produto em ordem: a primeira é a capa (cards, carrinho, e-mails); as outras
 * formam a galeria da página do produto. Várias de uma vez, até o limite.
 */
export function ProductImagesField({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const remaining = MAX_PRODUCT_IMAGES - value.length;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Cabem só mais ${remaining} ${remaining === 1 ? "foto" : "fotos"} — as outras ficaram de fora.`);
    }

    setUploadingCount(accepted.length);
    // Em sequência, na ordem escolhida: a ordem das fotos é a ordem da galeria.
    const uploaded: string[] = [];
    try {
      for (const file of accepted) {
        uploaded.push(await uploadToCloudinary(file));
        setUploadingCount((count) => count - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploadingCount(0);
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    }
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  function makeCover(index: number) {
    onChange([value[index], ...value.filter((_, i) => i !== index)]);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">Fotos do produto</Label>
      <p className="text-xs text-muted-foreground">
        Até {MAX_PRODUCT_IMAGES} fotos. A primeira é a capa, usada no cardápio e no carrinho.
      </p>

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {value.map((url, index) => (
            <li
              key={url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg bg-muted",
                index === 0 && "ring-2 ring-primary",
              )}
            >
              <Image src={url} alt={`Foto ${index + 1}`} fill sizes="120px" className="object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                  Capa
                </span>
              )}
              {!disabled && (
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Mover foto ${index + 1} para trás`}
                    >
                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      onClick={() => move(index, 1)}
                      disabled={index === value.length - 1}
                      aria-label={`Mover foto ${index + 1} para frente`}
                    >
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        className={ICON_BUTTON}
                        onClick={() => makeCover(index)}
                        aria-label={`Usar foto ${index + 1} como capa`}
                      >
                        <Star className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className={cn(ICON_BUTTON, "text-destructive")}
                      onClick={() => remove(index)}
                      aria-label={`Remover foto ${index + 1}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && remaining > 0 && (
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploadingCount > 0}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      )}
      {uploadingCount > 0 && (
        <p className="text-sm text-muted-foreground">
          Enviando {uploadingCount} {uploadingCount === 1 ? "foto" : "fotos"}...
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
