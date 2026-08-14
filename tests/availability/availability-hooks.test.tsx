/**
 * Hooks del módulo de disponibilidad.
 *
 * Lo que se fija aquí es el alcance de cada invalidación: crear o liberar un
 * bloqueo puede abarcar varias horas, así que la grilla se invalida **por
 * prefijo** —todas las semanas ya cacheadas— mientras que el horario general se
 * siembra directamente para la clave del espacio afectado.
 */

jest.mock("@/modules/availability/actions/availability", () => ({
  fetchServerNow: jest.fn(),
  fetchAvailability: jest.fn(),
  fetchAvailabilityStatistics: jest.fn(),
  fetchSchedule: jest.fn(),
  saveSchedule: jest.fn(),
  fetchExceptions: jest.fn(),
  createException: jest.fn(),
  updateException: jest.fn(),
  deleteException: jest.fn(),
  createBlock: jest.fn(),
  deleteBlock: jest.fn(),
}));
jest.mock("@/modules/availability/actions/aforo", () => ({
  fetchAforoSemana: jest.fn(),
  fetchAforoDia: jest.fn(),
}));

import { waitFor } from "@testing-library/react";
import * as availabilityActions from "@/modules/availability/actions/availability";
import * as aforoActions from "@/modules/availability/actions/aforo";
import { availabilityKeys } from "@/modules/availability/constants";
import {
  weekRange,
  useServerNow,
  useAvailabilityBlocks,
  useAvailabilityStatistics,
  useSchedule,
  useExceptions,
} from "@/modules/availability/hooks/useAvailability";
import { useAforoSemana, useAforoDia } from "@/modules/availability/hooks/useAforo";
import {
  useCreateBlock,
  useDeleteBlock,
  useSaveSchedule,
  useSaveException,
  useDeleteException,
} from "@/modules/availability/hooks/useAvailabilityActions";
import { createTestQueryClient, renderHookWithQuery } from "../helpers/render";

const acciones = jest.mocked(availabilityActions);
const aforo = jest.mocked(aforoActions);

const LUNES = new Date("2026-03-09T00:00:00");

describe("weekRange", () => {
  it("devuelve el lunes y el domingo de la semana en formato ISO", () => {
    expect(weekRange(LUNES)).toEqual({ fechaInicio: "2026-03-09", fechaFin: "2026-03-15" });
  });
});

describe("useServerNow", () => {
  it("convierte la marca del servidor en una fecha usable por la grilla", async () => {
    acciones.fetchServerNow.mockResolvedValue("2026-03-10T14:30:00.000Z");

    const { result } = renderHookWithQuery(() => useServerNow());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeInstanceOf(Date);
    expect(result.current.data?.toISOString()).toBe("2026-03-10T14:30:00.000Z");
  });
});

describe("useAvailabilityBlocks", () => {
  it("consulta el rango completo de la semana", async () => {
    acciones.fetchAvailability.mockResolvedValue([]);

    const { result } = renderHookWithQuery(() => useAvailabilityBlocks(1, LUNES, true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.fetchAvailability).toHaveBeenCalledWith("2026-03-09", "2026-03-15", 1);
  });

  /** Los espacios de cupo compartido usan el panel de aforo, no la grilla horaria. */
  it("no consulta cuando la grilla está desactivada", () => {
    const { result } = renderHookWithQuery(() => useAvailabilityBlocks(1, LUNES, false));

    expect(result.current.fetchStatus).toBe("idle");
    expect(acciones.fetchAvailability).not.toHaveBeenCalled();
  });

  it("no consulta si no hay espacio seleccionado", () => {
    const { result } = renderHookWithQuery(() => useAvailabilityBlocks(null, LUNES, true));

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAvailabilityStatistics", () => {
  it("consulta las métricas de la misma semana que la grilla", async () => {
    acciones.fetchAvailabilityStatistics.mockResolvedValue({
      horasDisponibles: 40,
      horasReservadas: 18,
      horasBloqueadas: 2,
      ocupacion: 30,
    });

    const { result } = renderHookWithQuery(() => useAvailabilityStatistics(1, LUNES, true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.fetchAvailabilityStatistics).toHaveBeenCalledWith(
      "2026-03-09",
      "2026-03-15",
      1,
    );
  });
});

describe("useSchedule", () => {
  /** El formulario de horario nunca debe quedarse sin valores que renderizar. */
  it("expone un horario por defecto mientras la consulta no ha resuelto", () => {
    acciones.fetchSchedule.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHookWithQuery(() => useSchedule(1));

    expect(result.current.schedule).toEqual({
      apertura: "08:00",
      cierre: "22:00",
      diasActivos: [0, 1, 2, 3, 4, 5, 6],
    });
  });

  it("expone el horario real una vez cargado", async () => {
    acciones.fetchSchedule.mockResolvedValue({
      apertura: "09:00",
      cierre: "20:00",
      diasActivos: [0, 1, 2, 3, 4],
      espacioId: 1,
    });

    const { result } = renderHookWithQuery(() => useSchedule(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.schedule.apertura).toBe("09:00");
  });

  it("no consulta sin espacio seleccionado", () => {
    const { result } = renderHookWithQuery(() => useSchedule(null));

    expect(result.current.fetchStatus).toBe("idle");
    expect(acciones.fetchSchedule).not.toHaveBeenCalled();
  });
});

describe("useExceptions", () => {
  it("carga las excepciones del espacio", async () => {
    acciones.fetchExceptions.mockResolvedValue([]);

    const { result } = renderHookWithQuery(() => useExceptions(3));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.fetchExceptions).toHaveBeenCalledWith(3);
  });

  it("no consulta sin espacio seleccionado", () => {
    const { result } = renderHookWithQuery(() => useExceptions(null));
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("hooks de aforo", () => {
  it("useAforoSemana pide el resumen del rango semanal", async () => {
    aforo.fetchAforoSemana.mockResolvedValue([]);

    const { result } = renderHookWithQuery(() => useAforoSemana(1, LUNES));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(aforo.fetchAforoSemana).toHaveBeenCalledWith(1, "2026-03-09", "2026-03-15");
  });

  /** El detalle de tickets solo se pide al abrir un día — carga perezosa. */
  it("useAforoDia no consulta hasta que se elige un día", () => {
    const { result } = renderHookWithQuery(() => useAforoDia(1, null));

    expect(result.current.fetchStatus).toBe("idle");
    expect(aforo.fetchAforoDia).not.toHaveBeenCalled();
  });

  it("useAforoDia carga el detalle del día elegido", async () => {
    aforo.fetchAforoDia.mockResolvedValue({
      fecha: "2026-03-10",
      capacidadTotal: 100,
      vendida: 20,
      disponible: 80,
      tickets: [],
    });

    const { result } = renderHookWithQuery(() => useAforoDia(1, "2026-03-10"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(aforo.fetchAforoDia).toHaveBeenCalledWith(1, "2026-03-10");
  });
});

describe("mutaciones de la agenda", () => {
  /**
   * Un bloqueo abarca un rango de horas y puede cruzar la semana visible: se
   * invalida el prefijo, no la clave exacta, para que toda semana ya cacheada
   * se vuelva a pedir.
   */
  it("useCreateBlock invalida bloques y estadísticas de todas las semanas", async () => {
    acciones.createBlock.mockResolvedValue([]);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useCreateBlock(), { client });

    result.current.mutate({
      espacioId: 1,
      fecha: "2026-03-10",
      hourStart: 9,
      hourEnd: 11,
      estado: "blocked",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const claves = invalidar.mock.calls.map(([a]) => JSON.stringify(a?.queryKey));
    expect(claves).toEqual([
      JSON.stringify(["availability", "blocks"]),
      JSON.stringify(["availability", "statistics"]),
    ]);
  });

  it("useDeleteBlock invalida la misma grilla al liberar un horario", async () => {
    acciones.deleteBlock.mockResolvedValue(undefined);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useDeleteBlock(), { client });

    result.current.mutate("b1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidar).toHaveBeenCalledTimes(2);
    expect(acciones.deleteBlock).toHaveBeenCalledWith("b1");
  });

  it("useSaveSchedule siembra el horario devuelto en la clave del espacio", async () => {
    const guardado = {
      apertura: "09:00",
      cierre: "20:00",
      diasActivos: [0, 1, 2, 3, 4],
      espacioId: 2,
    };
    acciones.saveSchedule.mockResolvedValue(guardado);

    const client = createTestQueryClient();
    const sembrar = jest.spyOn(client, "setQueryData");
    const { result } = renderHookWithQuery(() => useSaveSchedule(), { client });

    result.current.mutate(guardado);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sembrar).toHaveBeenCalledWith(availabilityKeys.schedule(2), guardado);
  });

  const excepcion = {
    espacioId: 3,
    titulo: "Feriado",
    fecha: "2026-05-24",
    tipo: "feriado" as const,
  };

  it("useSaveException crea cuando no recibe id", async () => {
    acciones.createException.mockResolvedValue({ id: "e1", ...excepcion });

    const { result } = renderHookWithQuery(() => useSaveException());

    result.current.mutate({ data: excepcion });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.createException).toHaveBeenCalledWith(excepcion);
    expect(acciones.updateException).not.toHaveBeenCalled();
  });

  it("useSaveException actualiza cuando sí recibe id", async () => {
    acciones.updateException.mockResolvedValue({ id: "e1", ...excepcion });

    const { result } = renderHookWithQuery(() => useSaveException());

    result.current.mutate({ id: "e1", data: excepcion });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.updateException).toHaveBeenCalledWith("e1", excepcion);
    expect(acciones.createException).not.toHaveBeenCalled();
  });

  it("useSaveException refresca solo las excepciones del espacio afectado", async () => {
    acciones.createException.mockResolvedValue({ id: "e1", ...excepcion });

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useSaveException(), { client });

    result.current.mutate({ data: excepcion });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidar).toHaveBeenCalledWith({ queryKey: availabilityKeys.exceptions(3) });
  });

  it("useDeleteException refresca la lista del espacio", async () => {
    acciones.deleteException.mockResolvedValue(undefined);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useDeleteException(3), { client });

    result.current.mutate("e1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidar).toHaveBeenCalledWith({ queryKey: availabilityKeys.exceptions(3) });
  });

  it("useDeleteException no invalida nada si no hay espacio seleccionado", async () => {
    acciones.deleteException.mockResolvedValue(undefined);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useDeleteException(null), { client });

    result.current.mutate("e1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidar).not.toHaveBeenCalled();
  });
});
