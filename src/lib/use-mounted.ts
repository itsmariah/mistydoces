"use client";

import { useSyncExternalStore } from "react";

/** true somente após a hidratação — evita valores client-only divergirem do HTML do servidor. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
