import Image from "next/image";
import { avatarImageUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

/**
 * Foto de perfil redonda; sem foto, a inicial do nome no círculo azul da marca.
 * Decorativa (`alt=""`): o nome sempre aparece ao lado ou no rótulo do botão.
 */
export function UserAvatar({
  name,
  avatarUrl,
  size = 36,
  className,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  /** Em px — controla também a versão pedida ao Cloudinary (2x para telas densas). */
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      <Image
        src={avatarImageUrl(avatarUrl, size * 2)}
        alt=""
        width={size}
        height={size}
        // O Cloudinary já entrega no tamanho e formato certos: otimizar de novo é desperdício.
        unoptimized
        style={style}
        className={cn("shrink-0 rounded-full bg-muted object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
