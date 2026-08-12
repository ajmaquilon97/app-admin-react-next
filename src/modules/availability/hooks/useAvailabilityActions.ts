"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as availabilityActions from "../actions/availability";
import { availabilityKeys } from "../constants";
import type { AvailabilityException, Schedule } from "../types";

/**
 * Invalida la grilla completa (bloques + estadísticas) de todas las semanas
 * cacheadas. Se invalida por prefijo a propósito: un bloqueo puede abarcar
 * varias horas y conviene que cualquier semana ya vista se vuelva a pedir.
 */
function invalidateGrid(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["availability", "blocks"] });
  qc.invalidateQueries({ queryKey: ["availability", "statistics"] });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      espacioId: number;
      fecha: string;
      hourStart: number;
      hourEnd: number;
      estado: "blocked" | "maintenance";
      notas?: string;
    }) => availabilityActions.createBlock(data),
    onSuccess: () => invalidateGrid(qc),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => availabilityActions.deleteBlock(id),
    onSuccess: () => invalidateGrid(qc),
  });
}

export function useSaveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schedule: Schedule & { espacioId: number }) =>
      availabilityActions.saveSchedule(schedule),
    onSuccess: (updated, variables) => {
      qc.setQueryData(availabilityKeys.schedule(variables.espacioId), updated);
    },
  });
}

export function useSaveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      /** `undefined` crea; con id actualiza. */
      id?: string;
      data: Omit<AvailabilityException, "id"> & { espacioId: number };
    }) =>
      id
        ? availabilityActions.updateException(id, data)
        : availabilityActions.createException(data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.exceptions(variables.data.espacioId) });
    },
  });
}

export function useDeleteException(espacioId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => availabilityActions.deleteException(id),
    onSuccess: () => {
      if (espacioId != null) {
        qc.invalidateQueries({ queryKey: availabilityKeys.exceptions(espacioId) });
      }
    },
  });
}
