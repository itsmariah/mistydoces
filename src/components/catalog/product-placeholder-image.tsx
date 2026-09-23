import Image from "next/image";
import { cn } from "@/lib/utils";

/** Ilustração usada sempre que um produto ainda não tem foto cadastrada. */
export function ProductPlaceholderImage({ className }: { className?: string }) {
  return (
    <Image
      src="/branding/17_gatinha_chefe_de_pe.png"
      alt=""
      fill
      className={cn("object-contain p-4", className)}
    />
  );
}
