import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { renderHook, type RenderHookOptions, type RenderHookResult } from "@testing-library/react";

/**
 * Utilidades de render compartidas por toda la suite.
 *
 * Todo componente del portal que consuma datos lo hace vía React Query, así que
 * necesita un `QueryClientProvider`. Se crea un cliente nuevo por prueba —con
 * reintentos desactivados y caché aislada— para cumplir el principio de
 * independencia entre pruebas descrito en la estrategia (§10.8.1).
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export function Providers({
  client,
  children,
}: {
  client: QueryClient;
  children: ReactNode;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function renderWithQuery(
  ui: ReactElement,
  options: RenderOptions & { client?: QueryClient } = {},
): RenderResult & { client: QueryClient } {
  const { client = createTestQueryClient(), ...rest } = options;
  const result = render(ui, {
    wrapper: ({ children }) => <Providers client={client}>{children}</Providers>,
    ...rest,
  });
  return { ...result, client };
}

export function renderHookWithQuery<Result, Props>(
  hook: (initialProps: Props) => Result,
  options: RenderHookOptions<Props> & { client?: QueryClient } = {},
): RenderHookResult<Result, Props> & { client: QueryClient } {
  const { client = createTestQueryClient(), ...rest } = options;
  const result = renderHook(hook, {
    wrapper: ({ children }) => <Providers client={client}>{children}</Providers>,
    ...rest,
  });
  return { ...result, client };
}
