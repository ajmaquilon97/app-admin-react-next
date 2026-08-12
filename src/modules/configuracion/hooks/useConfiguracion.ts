"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as configuracionActions from "@/actions/configuracion";
import * as negocioActions from "@/actions/negocio";
import * as reservasConfigActions from "@/actions/reservas-config";
import type { EspacioOption, NegocioInfo, PerfilAnfitrion, ReservationConfirmationMode } from "../types";

export const configuracionKeys = {
  perfil: ["configuracion", "perfil"] as const,
  negocio: ["configuracion", "negocio"] as const,
  bookingConfigs: ["configuracion", "reservas"] as const,
};

export function usePerfil() {
  return useQuery({
    queryKey: configuracionKeys.perfil,
    queryFn: () => configuracionActions.getPerfil(),
  });
}

export function useUpdatePerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PerfilAnfitrion) => configuracionActions.updatePerfil(input),
    onSuccess: (result) => qc.setQueryData(configuracionKeys.perfil, result),
  });
}

export function useNegocio() {
  return useQuery({
    queryKey: configuracionKeys.negocio,
    queryFn: () => negocioActions.getNegocio(),
  });
}

export function useUpdateNegocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NegocioInfo) => negocioActions.updateNegocio(input),
    onSuccess: (result) => qc.setQueryData(configuracionKeys.negocio, result),
  });
}

export function useBookingConfigs(espacios: EspacioOption[]) {
  return useQuery({
    queryKey: [...configuracionKeys.bookingConfigs, espacios.map((e) => e.id).join(",")],
    queryFn: () => reservasConfigActions.getBookingConfigs(espacios),
    enabled: espacios.length > 0,
  });
}

export function useUpdateBookingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      espacioId,
      espacioNombre,
      modo,
    }: {
      espacioId: number;
      espacioNombre: string;
      modo: ReservationConfirmationMode;
    }) => reservasConfigActions.updateBookingConfig(espacioId, espacioNombre, modo),
    onSuccess: () => qc.invalidateQueries({ queryKey: configuracionKeys.bookingConfigs }),
  });
}
