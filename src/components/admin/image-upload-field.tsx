"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";

type SignResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
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
      onChange(data.secure_url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">Imagem do produto</Label>
      {value && (
        <div className="relative h-32 w-32 overflow-hidden rounded-lg bg-muted">
          <Image src={value} alt="Imagem do produto" fill className="object-cover" />
        </div>
      )}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
      />
      {isUploading && <p className="text-sm text-muted-foreground">Enviando imagem...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
