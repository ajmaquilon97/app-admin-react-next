"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "./service";
import type { EspacioPricing, FechaEspecial, Promocion } from "./types";

export const pricingKeys = {
  all: ["pricing"] as const,
  byEspacio: (id: number) => ["pricing", id] as const,
};

export function usePricing(espacioId: number | null) {
  return useQuery({
    queryKey: pricingKeys.byEspacio(espacioId ?? 0),
    queryFn: () => pricingService.getPricing(espacioId!),
    enabled: espacioId != null,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSavePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EspacioPricing) => pricingService.savePricing(data),
    onSuccess: (data) => {
      qc.setQueryData(pricingKeys.byEspacio(data.espacioId), data);
    },
  });
}

export function useAddFechaEspecial(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fe: Omit<FechaEspecial, "id">) => pricingService.addFechaEspecial(espacioId, fe),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useDeleteFechaEspecial(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feId: string) => pricingService.deleteFechaEspecial(espacioId, feId),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useAddPromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promo: Omit<Promocion, "id">) => pricingService.addPromocion(espacioId, promo),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useTogglePromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      pricingService.togglePromocion(espacioId, id, activa),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}

export function useDeletePromocion(espacioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingService.deletePromocion(espacioId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pricingKeys.byEspacio(espacioId) }),
  });
}
