type SignResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};

/**
 * Upload assinado direto para o Cloudinary: o arquivo não passa pelo nosso servidor.
 * O destino só escolhe a pasta — quem pode enviar para cada uma o servidor decide.
 */
export async function uploadToCloudinary(
  file: File,
  target: "product" | "avatar",
): Promise<string> {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target }),
  });
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
    const body = await uploadResponse.json().catch(() => null);
    const reason = body?.error?.message ? ` (${body.error.message})` : "";
    throw new Error(`Falha no upload da imagem. Confira as credenciais do Cloudinary.${reason}`);
  }
  const data = await uploadResponse.json();
  return data.secure_url as string;
}
