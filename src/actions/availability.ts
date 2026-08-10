"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import type {
  Block,
  Statistics,
  Schedule,
  AvailabilityException,
} from "@/modules/availability/types";

// ── Internal backend response shapes ────────────────────────────────────────

type SlotResponse = {
  id: string;
  espacioId: number;
  espacioNombre: string;
  fecha: string;
  hora: number;
  estado: string;
  clienteNombre?: string;
  notas?: string;
};

type StatsResponse = {
  horasDisponibles: number;
  horasReservadas: number;
  horasBloqueadas: number;
  ocupacion: number;
};

type ScheduleResponse = {
  espacioId: number;
  apertura: string;    // "HH:mm:ss" (.NET TimeSpan)
  cierre: string;
  diasActivos: number[]; // 0=Dom, 1=Lun … 6=Sáb
};

type ExcepcionResponse = {
  id: string;
  espacioId: number;
  titulo: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tipo: string;
};

type BloqueoRawResponse = {
  id: string;
  espacioId: number;
  espacioNombre: string;
  fecha: string;
  hora: number;
  estado: string;
  notas?: string;
};

// ── Mapping helpers ──────────────────────────────────────────────────────────

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

function mapSlot(s: SlotResponse): Block {
  return {
    id: s.id,
    espacioId: s.espacioId,
    espacioNombre: s.espacioNombre,
    date: s.fecha,
    hour: s.hora,
    status: s.estado as Block["status"],
    clientName: s.clienteNombre,
    notes: s.notas,
  };
}

function mapSchedule(s: ScheduleResponse): Schedule {
  return {
    apertura: trimTime(s.apertura),
    cierre: trimTime(s.cierre),
    diasActivos: s.diasActivos.map(backendToUiDay),
    espacioId: s.espacioId,
  };
}

function mapException(e: ExcepcionResponse): AvailabilityException {
  return {
    id: e.id,
    titulo: e.titulo,
    fecha: e.fecha,
    horaInicio: e.horaInicio ? trimTime(e.horaInicio) : undefined,
    horaFin: e.horaFin ? trimTime(e.horaFin) : undefined,
    tipo: e.tipo as AvailabilityException["tipo"],
  };
}

// ── Auth fetch helper ────────────────────────────────────────────────────────

function baseUrl() {
  const u = process.env.API_BASE_URL;
  if (!u) throw new Error("API_BASE_URL not configured");
  return u;
}

async function authedFetch(path: string, init?: RequestInit) {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
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
  const params = new URLSearchParams({ fechaInicio, fechaFin });
  if (espacioId !== undefined) params.set("espacioId", String(espacioId));

  const res = await authedFetch(`/api/availability?${params}`);
  if (!res.ok) throw new Error("No se pudo cargar la disponibilidad.");
  const data = (await res.json()) as SlotResponse[];
  console.log(
    `[availability] GET /api/availability?${params} → ${data.length} slots, ` +
      `por espacio+estado: ${JSON.stringify(
        data.reduce<Record<string, number>>((acc, s) => {
          const key = `${s.espacioId}:${s.estado}`;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
      )}`,
  );
  return data.map(mapSlot);
}

export async function fetchAvailabilityStatistics(
  fechaInicio: string,
  fechaFin: string,
  espacioId?: number,
): Promise<Statistics> {
  const params = new URLSearchParams({ fechaInicio, fechaFin });
  if (espacioId !== undefined) params.set("espacioId", String(espacioId));

  const res = await authedFetch(`/api/availability/statistics?${params}`);
  if (!res.ok) throw new Error("No se pudieron cargar los indicadores.");

  const raw = (await res.json()) as {
    disponibles: number;
    reservadas: number;
    bloqueadas: number;
    porcentajeOcupacion: number;
  };

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
  const res = await authedFetch(`/api/availability/schedule?espacioId=${espacioId}`);
  if (res.status === 404) {
    // Esperado: el backend no auto-crea un horario, a diferencia del tarifario.
    return { ...DEFAULT_SCHEDULE, espacioId };
  }
  if (!res.ok) throw new Error("No se pudo cargar el horario.");
  const data = (await res.json()) as ScheduleResponse;
  return mapSchedule(data);
}

export async function saveSchedule(schedule: Schedule & { espacioId: number }): Promise<Schedule> {
  const body = {
    espacioId: schedule.espacioId,
    apertura: padTime(schedule.apertura),
    cierre: padTime(schedule.cierre),
    diasActivos: schedule.diasActivos.map(uiToBackendDay),
  };
  const res = await authedFetch("/api/availability/schedule", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("No se pudo guardar el horario.");
  const data = (await res.json()) as ScheduleResponse;
  return mapSchedule(data);
}

export async function fetchExceptions(espacioId?: number): Promise<AvailabilityException[]> {
  const params = espacioId !== undefined ? `?espacioId=${espacioId}` : "";
  const res = await authedFetch(`/api/availability/exceptions${params}`);
  if (!res.ok) throw new Error("No se pudieron cargar las excepciones.");
  const data = (await res.json()) as ExcepcionResponse[];
  return data.map(mapException);
}

export async function createException(
  data: Omit<AvailabilityException, "id"> & { espacioId: number },
): Promise<AvailabilityException> {
  const body = {
    espacioId: data.espacioId,
    titulo: data.titulo,
    fecha: data.fecha,
    tipo: data.tipo,
    horaInicio: data.horaInicio ? padTime(data.horaInicio) : null,
    horaFin: data.horaFin ? padTime(data.horaFin) : null,
  };
  const res = await authedFetch("/api/availability/exceptions", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("No se pudo crear la excepción.");
  const created = (await res.json()) as ExcepcionResponse;
  return mapException(created);
}

export async function updateException(
  id: string,
  data: Omit<AvailabilityException, "id"> & { espacioId: number },
): Promise<AvailabilityException> {
  const body = {
    espacioId: data.espacioId,
    titulo: data.titulo,
    fecha: data.fecha,
    tipo: data.tipo,
    horaInicio: data.horaInicio ? padTime(data.horaInicio) : null,
    horaFin: data.horaFin ? padTime(data.horaFin) : null,
  };
  const res = await authedFetch(`/api/availability/exceptions/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("No se pudo actualizar la excepción.");
  const updated = (await res.json()) as ExcepcionResponse;
  return mapException(updated);
}

export async function deleteException(id: string): Promise<void> {
  const res = await authedFetch(`/api/availability/exceptions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar la excepción.");
}

export async function createBlock(data: {
  espacioId: number;
  fecha: string;
  hourStart: number;
  hourEnd: number;
  estado: "blocked" | "maintenance";
  notas?: string;
}): Promise<Block[]> {
  const body = {
    espacioId: data.espacioId,
    fecha: data.fecha,
    hourStart: data.hourStart,
    hourEnd: data.hourEnd,
    estado: data.estado,
    notas: data.notas ?? null,
  };
  console.log("[availability/block] POST /api/availability/block →", body);

  const res = await authedFetch("/api/availability/block", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log(`[availability/block] POST /api/availability/block ${res.status} →`, raw);

  if (res.status === 409) throw new Error("Alguno de los horarios ya está ocupado.");
  if (!res.ok) throw new Error("No se pudo crear el bloqueo.");

  const created = JSON.parse(raw) as BloqueoRawResponse[];
  return created.map((b) => ({
    id: b.id,
    espacioId: b.espacioId,
    espacioNombre: b.espacioNombre,
    date: b.fecha,
    hour: b.hora,
    status: b.estado as Block["status"],
    notes: b.notas,
  }));
}

export async function deleteBlock(id: string): Promise<void> {
  if (!id) {
    console.error(`[availability/block] deleteBlock recibió un id inválido: ${JSON.stringify(id)}`);
    throw new Error("Este horario no tiene un identificador válido para liberar.");
  }

  console.log(`[availability/block] DELETE /api/availability/block/${id}`);
  const res = await authedFetch(`/api/availability/block/${id}`, {
    method: "DELETE",
  });

  const raw = await res.text();
  console.log(`[availability/block] DELETE /api/availability/block/${id} ${res.status} →`, raw);

  if (!res.ok) throw new Error("No se pudo eliminar el bloqueo.");
}
