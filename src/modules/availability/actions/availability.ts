"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/auth/session";
import * as availabilityApi from "../api/availability";
import type {
  Block,
  Statistics,
  Schedule,
  AvailabilityException,
} from "../types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

// ── Mapeo backend → dominio ─────────────────────────────────────────────────────

function trimTime(t: string): string {
  // "08:00:00" → "08:00"
  return t.length > 5 ? t.slice(0, 5) : t;
}

function padTime(t: string): string {
  // "08:00" → "08:00:00"
  return t.length === 5 ? `${t}:00` : t;
}

// Backend: 0=Dom,1=Lun…6=Sáb  ↔  Frontend: 0=Lun,1=Mar…6=Dom
const backendToUiDay = (d: number) => (d + 6) % 7;
const uiToBackendDay = (d: number) => (d + 1) % 7;

function toBlock(s: availabilityApi.SlotApi | availabilityApi.BloqueoApi): Block {
  return {
    id: s.id,
    espacioId: s.espacioId,
    espacioNombre: s.espacioNombre,
    date: s.fecha,
    hour: s.hora,
    status: s.estado as Block["status"],
    clientName: "clienteNombre" in s ? s.clienteNombre : undefined,
    notes: s.notas,
  };
}

function toSchedule(s: availabilityApi.ScheduleApi): Schedule {
  return {
    apertura: trimTime(s.apertura),
    cierre: trimTime(s.cierre),
    diasActivos: s.diasActivos.map(backendToUiDay),
    espacioId: s.espacioId,
  };
}

function toException(e: availabilityApi.ExcepcionApi): AvailabilityException {
  return {
    id: e.id,
    titulo: e.titulo,
    fecha: e.fecha,
    horaInicio: e.horaInicio ? trimTime(e.horaInicio) : undefined,
    horaFin: e.horaFin ? trimTime(e.horaFin) : undefined,
    tipo: e.tipo as AvailabilityException["tipo"],
  };
}

function toExceptionRequest(
  data: Omit<AvailabilityException, "id"> & { espacioId: number },
): availabilityApi.ExcepcionRequestApi {
  return {
    espacioId: data.espacioId,
    titulo: data.titulo,
    fecha: data.fecha,
    tipo: data.tipo,
    horaInicio: data.horaInicio ? padTime(data.horaInicio) : null,
    horaFin: data.horaFin ? padTime(data.horaFin) : null,
  };
}

// ── Server actions ────────────────────────────────────────────────────────────

/**
 * Hora del servidor (Amplify), no la del navegador — así "qué horas ya pasaron"
 * en la grilla no depende del reloj del equipo del usuario.
 */
export async function fetchServerNow(): Promise<string> {
  return new Date().toISOString();
}

export async function fetchAvailability(
  fechaInicio: string,
  fechaFin: string,
  espacioId?: number,
): Promise<Block[]> {
  const accessToken = await requireAccessToken();
  const slots = await availabilityApi.getAvailability({ fechaInicio, fechaFin, espacioId }, accessToken);
  return slots.map(toBlock);
}

export async function fetchAvailabilityStatistics(
  fechaInicio: string,
  fechaFin: string,
  espacioId?: number,
): Promise<Statistics> {
  const accessToken = await requireAccessToken();
  const raw = await availabilityApi.getStatistics({ fechaInicio, fechaFin, espacioId }, accessToken);
  return {
    horasDisponibles: raw.disponibles,
    horasReservadas: raw.reservadas,
    horasBloqueadas: raw.bloqueadas,
    ocupacion: raw.porcentajeOcupacion,
  };
}

/** Horario por defecto para un espacio que todavía no configuró uno propio. */
const DEFAULT_SCHEDULE: Omit<Schedule, "espacioId"> = {
  apertura: "08:00",
  cierre: "22:00",
  diasActivos: [0, 1, 2, 3, 4, 5, 6],
};

export async function fetchSchedule(espacioId: number): Promise<Schedule> {
  const accessToken = await requireAccessToken();
  const data = await availabilityApi.getSchedule(espacioId, accessToken);
  if (!data) return { ...DEFAULT_SCHEDULE, espacioId };
  return toSchedule(data);
}

export async function saveSchedule(schedule: Schedule & { espacioId: number }): Promise<Schedule> {
  const accessToken = await requireAccessToken();
  const data = await availabilityApi.putSchedule(
    {
      espacioId: schedule.espacioId,
      apertura: padTime(schedule.apertura),
      cierre: padTime(schedule.cierre),
      diasActivos: schedule.diasActivos.map(uiToBackendDay),
    },
    accessToken,
  );
  return toSchedule(data);
}

export async function fetchExceptions(espacioId?: number): Promise<AvailabilityException[]> {
  const accessToken = await requireAccessToken();
  const data = await availabilityApi.getExceptions(espacioId, accessToken);
  return data.map(toException);
}

export async function createException(
  data: Omit<AvailabilityException, "id"> & { espacioId: number },
): Promise<AvailabilityException> {
  const accessToken = await requireAccessToken();
  const created = await availabilityApi.postException(toExceptionRequest(data), accessToken);
  return toException(created);
}

export async function updateException(
  id: string,
  data: Omit<AvailabilityException, "id"> & { espacioId: number },
): Promise<AvailabilityException> {
  const accessToken = await requireAccessToken();
  const updated = await availabilityApi.putException(id, toExceptionRequest(data), accessToken);
  return toException(updated);
}

export async function deleteException(id: string): Promise<void> {
  const accessToken = await requireAccessToken();
  await availabilityApi.deleteException(id, accessToken);
}

export async function createBlock(data: {
  espacioId: number;
  fecha: string;
  hourStart: number;
  hourEnd: number;
  estado: "blocked" | "maintenance";
  notas?: string;
}): Promise<Block[]> {
  const accessToken = await requireAccessToken();
  const created = await availabilityApi.postBlock(
    {
      espacioId: data.espacioId,
      fecha: data.fecha,
      hourStart: data.hourStart,
      hourEnd: data.hourEnd,
      estado: data.estado,
      notas: data.notas ?? null,
    },
    accessToken,
  );
  return created.map(toBlock);
}

export async function deleteBlock(id: string): Promise<void> {
  if (!id) {
    console.error(`[availability/block] deleteBlock recibió un id inválido: ${JSON.stringify(id)}`);
    throw new Error("Este horario no tiene un identificador válido para liberar.");
  }
  const accessToken = await requireAccessToken();
  await availabilityApi.deleteBlock(id, accessToken);
}
