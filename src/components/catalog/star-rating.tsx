import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const rounded = Math.round(value);
  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            starSize,
            index < rounded ? "fill-link text-link" : "fill-none text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}
