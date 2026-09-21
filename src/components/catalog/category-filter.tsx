import Link from "next/link";
import type { Category } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  categories: Category[];
  activeSlug?: string;
};

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/cardapio"
        className={cn(
          "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activeSlug
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/cardapio?categoria=${category.slug}`}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activeSlug === category.slug
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
