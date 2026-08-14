"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAforoSemana, fetchAforoDia } from "../actions/aforo";
import { availabilityKeys } from "../constants";
import { weekRange } from "./useAvailability";

/** Resumen de ocupación de los 7 días de la semana. */
export function useAforoSemana(espacioId: number, weekStart: Date) {
  const { fechaInicio, fechaFin } = weekRange(weekStart);
  return useQuery({
    queryKey: availabilityKeys.aforoSemana(espacioId, fechaInicio, fechaFin),
    queryFn: () => fetchAforoSemana(espacioId, fechaInicio, fechaFin),
    placeholderData: (prev) => prev,
  });
}

/** Detalle (tickets) del día seleccionado — carga perezosa. */
export function useAforoDia(espacioId: number, fecha: string | null) {
  return useQuery({
    queryKey: availabilityKeys.aforoDia(espacioId, fecha ?? ""),
    queryFn: () => fetchAforoDia(espacioId, fecha!),
    enabled: fecha != null,
  });
}
