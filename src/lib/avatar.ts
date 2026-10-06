/** Pasta do Cloudinary das fotos de perfil (a rota de assinatura só libera esta para clientes). */
export const AVATAR_FOLDER = "mistydoces/avatars";

/**
 * Só aceita foto enviada para a nossa conta do Cloudinary, na pasta de avatares: impede que
 * alguém salve um link qualquer (de outro site ou de outra pasta) como foto de perfil.
 */
export function isOwnAvatarUrl(url: string, cloudName: string | undefined): boolean {
  if (!cloudName) return false;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return false;
  // Depois do prefixo: versão opcional ("v123/") e o caminho dentro da pasta.
  return /^(v\d+\/)?mistydoces\/avatars\/[\w-]+\.(jpe?g|png|webp|gif|avif|heic)$/i.test(
    url.slice(prefix.length),
  );
}

/**
 * Versão quadrada, recortada no rosto pelo Cloudinary (`g_face`; sem rosto, centraliza),
 * no tamanho de exibição — a foto original pode ter vários megas.
 */
export function avatarImageUrl(url: string, size = 256): string {
  return url.replace("/image/upload/", `/image/upload/c_thumb,g_face,w_${size},h_${size},f_auto/`);
}
