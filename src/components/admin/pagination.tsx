import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition-colors";

/** Paginação numerada por links: a página fica na URL, então voltar e compartilhar funcionam. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(ITEM_CLASS, "border-border hover:bg-muted")}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(ITEM_CLASS, "border-border opacity-40")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {getPageItems(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Página ${item}`}
            className={cn(
              ITEM_CLASS,
              item === page
                ? "border-link bg-primary/10 font-medium text-link"
                : "border-border hover:bg-muted",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(ITEM_CLASS, "border-border hover:bg-muted")}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Próxima página</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(ITEM_CLASS, "border-border opacity-40")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
