"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cardapioHref, type CatalogSort } from "@/lib/catalog-sort";
import { Input } from "@/components/ui/input";

/** Espera o cliente parar de digitar antes de buscar, para não navegar a cada letra. */
const SEARCH_DEBOUNCE_MS = 350;

type SearchInputProps = {
  /** Busca atual da URL (`?busca=`). */
  query: string;
  categoria?: string;
  ordem: CatalogSort;
};

export function SearchInput({ query, categoria, ordem }: SearchInputProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(query);
  // Última busca que este campo mandou para a URL — distingue "a URL alcançou o que
  // eu digitei" (não mexer no campo) de "alguém limpou a busca por fora" (sincronizar).
  const [lastSent, setLastSent] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    if (query !== lastSent) {
      setValue(query);
      setLastSent(query);
    }
  }

  const search = useCallback(
    (term: string) => {
      setLastSent(term);
      startTransition(() => {
        // `replace`: cada letra não deve virar uma entrada no histórico do "voltar".
        router.replace(cardapioHref({ categoria, ordem, busca: term }), { scroll: false });
      });
    },
    [router, categoria, ordem],
  );

  useEffect(() => {
    const term = value.trim();
    if (term === lastSent) return;
    const timer = setTimeout(() => search(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, lastSent, search]);

  return (
    <form
      role="search"
      className="relative w-full sm:max-w-sm"
      onSubmit={(event) => {
        event.preventDefault();
        search(value.trim());
      }}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar doces…"
        aria-label="Buscar no cardápio"
        className="h-10 rounded-full pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute top-1/2 right-3 -translate-y-1/2">
        {isPending ? (
          <Loader2 aria-label="Buscando" className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          value && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setValue("");
                search("");
              }}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>
    </form>
  );
}
