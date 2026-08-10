"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Provider único de React Query para todo el portal.
 *
 * IMPORTANTE — el `QueryClient` se crea dentro de `useState` a propósito:
 * los Client Components también se renderizan en el servidor, así que un
 * cliente creado a nivel de módulo (`const qc = new QueryClient()`) sería un
 * singleton compartido entre TODOS los requests y el cache de un anfitrión
 * podría servirse a otro. `useState` garantiza una instancia por request/pestaña.
 *
 * Los defaults de abajo son el piso común; cada hook puede sobreescribirlos
 * (`staleTime`, `refetchInterval`, etc.) según su caso de uso.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
