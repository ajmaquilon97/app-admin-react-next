"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as pricingActions from "../actions/pricing";
import { pricingKeys } from "../constants";
import type { EspacioPricing, FechaEspecial, Promocion } from "../types";

export function usePricing(espacioId: number | null) {
  return useQuery({
    queryKey: pricingKeys.byEspacio(espacioId ?? 0),
    queryFn: () => pricingActions.getPricing(espacioId!),
    enabled: espacioId != null,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EspacioPricing) =>
      pricingActions.savePricing(data.espacioId, {
        modalidades: data.modalidades,
        tarifasPorDia: data.tarifasPorDia,
      }),
    onSuccess: (result, variables) => {
      // El PUT solo devuelve modalidades + tarifasPorDia autoritativas — se
      // preservan fechasEspeciales/promociones ya presentes en caché.
      qc.setQueryData(pricingKeys.byEspacio(variables.espacioId), (old: EspacioPricing | undefined) => ({
        ...(old ?? variables),
        modalidades: result.modalidades,
        tarifasPorDia: result.tarifasPorDia,
      }));
    },
  });
}

export function useAddFechaEspecial(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fe: Omit<FechaEspecial, "id">) => pricingActions.addFechaEspecial(espacioId, fe),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useDeleteFechaEspecial(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feId: string) => pricingActions.deleteFechaEspecial(espacioId, feId),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useAddPromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promo: Omit<Promocion, "id">) => pricingActions.addPromocion(espacioId, promo),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useTogglePromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      pricingActions.togglePromocion(espacioId, id, activa),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useDeletePromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingActions.deletePromocion(espacioId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}
