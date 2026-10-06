"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { adminProductsHref } from "@/lib/admin-products";
import { Input } from "@/components/ui/input";

/** Espera parar de digitar antes de filtrar, para não navegar a cada letra. */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Busca e categoria da lista de produtos do painel: a lista filtra enquanto se digita
 * (por pedaço do nome, sem acento) e ao trocar a categoria, sem botão de enviar.
 */
export function ProductFilters({
  busca = "",
  categoria,
  status,
  categories,
}: {
  busca?: string;
  categoria?: string;
  status?: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(busca);
  // Mesmo controle do campo de busca da loja: distingue "a URL alcançou o que eu digitei"
  // de "alguém limpou a busca por fora" (ex.: o link "Limpar filtros").
  const [lastSent, setLastSent] = useState(busca);
  const [prevBusca, setPrevBusca] = useState(busca);

  if (busca !== prevBusca) {
    setPrevBusca(busca);
    if (busca !== lastSent) {
      setValue(busca);
      setLastSent(busca);
    }
  }

  const navigate = useCallback(
    (query: { busca: string; categoria?: string }) => {
      setLastSent(query.busca);
      startTransition(() => {
        // `replace`: cada letra não deve virar uma entrada no histórico do "voltar".
        router.replace(adminProductsHref({ ...query, status }), { scroll: false });
      });
    },
    [router, status],
  );

  useEffect(() => {
    const term = value.trim();
    if (term === lastSent) return;
    const timer = setTimeout(() => navigate({ busca: term, categoria }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, lastSent, categoria, navigate]);

  return (
    <form
      role="search"
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ busca: value.trim(), categoria });
      }}
    >
      <div className="relative min-w-48 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar produto"
          aria-label="Buscar produtos"
          className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
          {isPending ? (
            <Loader2 aria-label="Buscando" className="size-4 animate-spin text-muted-foreground" />
          ) : (
            value && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setValue("");
                  navigate({ busca: "", categoria });
                }}
                className="flex rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )
          )}
        </div>
      </div>
      <select
        value={categoria ?? ""}
        onChange={(event) =>
          navigate({ busca: value.trim(), categoria: event.target.value || undefined })
        }
        aria-label="Filtrar por categoria"
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </form>
  );
}
