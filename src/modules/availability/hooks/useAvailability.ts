"use client";

import { useQuery } from "@tanstack/react-query";
import * as availabilityActions from "@/actions/availability";
import { availabilityKeys } from "../constants";
import { getWeekDates, formatISODate } from "../utils/date";
import type { Schedule } from "../types";

const DEFAULT_SCHEDULE: Schedule = {
  apertura: "08:00",
  cierre: "22:00",
  diasActivos: [0, 1, 2, 3, 4, 5, 6],
};

/** Rango [lunes, domingo] de la semana, en formato "YYYY-MM-DD". */
export function weekRange(weekStart: Date): { fechaInicio: string; fechaFin: string } {
  const dates = getWeekDates(weekStart);
  return {
    fechaInicio: formatISODate(dates[0]!),
    fechaFin: formatISODate(dates[6]!),
  };
}

/**
 * Hora del servidor, para que la grilla no dependa del reloj del navegador.
 * Se pide una sola vez: no depende de la semana ni del espacio.
 */
export function useServerNow() {
  return useQuery({
    queryKey: availabilityKeys.serverNow,
    queryFn: async () => new Date(await availabilityActions.fetchServerNow()),
    staleTime: Infinity,
  });
}

/**
 * Bloques de la grilla horaria. `enabled` se apaga para espacios de cupo
 * compartido, que usan el panel de aforo en vez de la grilla.
 */
export function useAvailabilityBlocks(
  espacioId: number | null,
  weekStart: Date,
  enabled: boolean,
) {
  const { fechaInicio, fechaFin } = weekRange(weekStart);
  return useQuery({
    queryKey: availabilityKeys.blocks(espacioId ?? 0, fechaInicio, fechaFin),
    queryFn: () => availabilityActions.fetchAvailability(fechaInicio, fechaFin, espacioId!),
    enabled: enabled && espacioId != null,
    placeholderData: (prev) => prev,
  });
}

export function useAvailabilityStatistics(
  espacioId: number | null,
  weekStart: Date,
  enabled: boolean,
) {
  const { fechaInicio, fechaFin } = weekRange(weekStart);
  return useQuery({
    queryKey: availabilityKeys.statistics(espacioId ?? 0, fechaInicio, fechaFin),
    queryFn: () =>
      availabilityActions.fetchAvailabilityStatistics(fechaInicio, fechaFin, espacioId!),
    enabled: enabled && espacioId != null,
    placeholderData: (prev) => prev,
  });
}

/**
 * Horario general del espacio. Si el backend aún no tiene uno configurado, la
 * action devuelve el default — este hook solo cubre el caso de error.
 */
export function useSchedule(espacioId: number | null) {
  const query = useQuery({
    queryKey: availabilityKeys.schedule(espacioId ?? 0),
    queryFn: () => availabilityActions.fetchSchedule(espacioId!),
    enabled: espacioId != null,
  });
  return { ...query, schedule: query.data ?? DEFAULT_SCHEDULE };
}

export function useExceptions(espacioId: number | null) {
  return useQuery({
    queryKey: availabilityKeys.exceptions(espacioId ?? 0),
    queryFn: () => availabilityActions.fetchExceptions(espacioId!),
    enabled: espacioId != null,
  });
}
