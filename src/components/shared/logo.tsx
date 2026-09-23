import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Proporção real do arquivo (365x299).
const ICON_ASPECT_RATIO = 365 / 299;
const SIZES = {
  sm: { icon: 32, text: "text-xl" },
  lg: { icon: 64, text: "text-3xl" },
} as const;

export function Logo({
  className,
  size = "sm",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  const { icon: iconHeight, text: textSize } = SIZES[size];
  const iconWidth = Math.round(iconHeight * ICON_ASPECT_RATIO);

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 font-heading font-semibold text-foreground",
        textSize,
        className,
      )}
    >
      <Image
        src="/branding/02_gatinha_dormindo.png"
        alt=""
        width={iconWidth}
        height={iconHeight}
      />
      <span>
        Misty<span className="text-primary">Doces</span>
      </span>
    </Link>
  );
}
