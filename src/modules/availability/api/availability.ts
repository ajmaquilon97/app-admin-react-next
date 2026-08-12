import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

function authHeaders(accessToken: string, json = false): HeadersInit {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${accessToken}`,
  };
}

// ── Formas del backend (ApiTesis) ───────────────────────────────────────────────

export type SlotApi = {
  id: string;
  espacioId: number;
  espacioNombre: string;
  fecha: string;
  hora: number;
  estado: string;
  clienteNombre?: string;
  notas?: string;
};

export type StatisticsApi = {
  disponibles: number;
  reservadas: number;
  bloqueadas: number;
  porcentajeOcupacion: number;
};

export type ScheduleApi = {
  espacioId: number;
  apertura: string; // "HH:mm:ss" (.NET TimeSpan)
  cierre: string;
  diasActivos: number[]; // 0=Dom, 1=Lun … 6=Sáb
};

export type ExcepcionApi = {
  id: string;
  espacioId: number;
  titulo: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tipo: string;
};

export type BloqueoApi = {
  id: string;
  espacioId: number;
  espacioNombre: string;
  fecha: string;
  hora: number;
  estado: string;
  notas?: string;
};

export type ExcepcionRequestApi = {
  espacioId: number;
  titulo: string;
  fecha: string;
  tipo: string;
  horaInicio: string | null;
  horaFin: string | null;
};

export type BloqueoRequestApi = {
  espacioId: number;
  fecha: string;
  hourStart: number;
  hourEnd: number;
  estado: "blocked" | "maintenance";
  notas: string | null;
};

/** Alguno de los horarios pedidos ya estaba ocupado (HTTP 409). */
export class SlotOcupadoError extends Error {}

// ── Slots y estadísticas ────────────────────────────────────────────────────────

export async function getAvailability(
  params: { fechaInicio: string; fechaFin: string; espacioId?: number },
  accessToken: string,
): Promise<SlotApi[]> {
  const qs = new URLSearchParams({ fechaInicio: params.fechaInicio, fechaFin: params.fechaFin });
  if (params.espacioId !== undefined) qs.set("espacioId", String(params.espacioId));

  const res = await fetch(apiUrl(`/api/availability?${qs}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar la disponibilidad.");

  const data = (await res.json()) as SlotApi[];
  console.log(
    `[availability] GET /api/availability?${qs} → ${data.length} slots, ` +
      `por espacio+estado: ${JSON.stringify(
        data.reduce<Record<string, number>>((acc, s) => {
          const key = `${s.espacioId}:${s.estado}`;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
      )}`,
  );
  return data;
}

export async function getStatistics(
  params: { fechaInicio: string; fechaFin: string; espacioId?: number },
  accessToken: string,
): Promise<StatisticsApi> {
  const qs = new URLSearchParams({ fechaInicio: params.fechaInicio, fechaFin: params.fechaFin });
  if (params.espacioId !== undefined) qs.set("espacioId", String(params.espacioId));

  const res = await fetch(apiUrl(`/api/availability/statistics?${qs}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron cargar los indicadores.");
  return (await res.json()) as StatisticsApi;
}

// ── Horario general ─────────────────────────────────────────────────────────────

/**
 * `null` cuando el backend responde 404: no auto-crea un horario, a diferencia del
 * tarifario. El default lo decide la capa de dominio, no el transporte.
 */
export async function getSchedule(
  espacioId: number,
  accessToken: string,
): Promise<ScheduleApi | null> {
  const res = await fetch(apiUrl(`/api/availability/schedule?espacioId=${espacioId}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar el horario.");
  return (await res.json()) as ScheduleApi;
}

export async function putSchedule(
  body: { espacioId: number; apertura: string; cierre: string; diasActivos: number[] },
  accessToken: string,
): Promise<ScheduleApi> {
  const res = await fetch(apiUrl("/api/availability/schedule"), {
    method: "PUT",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo guardar el horario.");
  return (await res.json()) as ScheduleApi;
}

// ── Excepciones ─────────────────────────────────────────────────────────────────

export async function getExceptions(
  espacioId: number | undefined,
  accessToken: string,
): Promise<ExcepcionApi[]> {
  const qs = espacioId !== undefined ? `?espacioId=${espacioId}` : "";
  const res = await fetch(apiUrl(`/api/availability/exceptions${qs}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron cargar las excepciones.");
  return (await res.json()) as ExcepcionApi[];
}

export async function postException(
  body: ExcepcionRequestApi,
  accessToken: string,
): Promise<ExcepcionApi> {
  const res = await fetch(apiUrl("/api/availability/exceptions"), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo crear la excepción.");
  return (await res.json()) as ExcepcionApi;
}

export async function putException(
  id: string,
  body: ExcepcionRequestApi,
  accessToken: string,
): Promise<ExcepcionApi> {
  const res = await fetch(apiUrl(`/api/availability/exceptions/${id}`), {
    method: "PUT",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo actualizar la excepción.");
  return (await res.json()) as ExcepcionApi;
}

export async function deleteException(id: string, accessToken: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/availability/exceptions/${id}`), {
    method: "DELETE",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo eliminar la excepción.");
}

// ── Bloqueos ────────────────────────────────────────────────────────────────────

export async function postBlock(
  body: BloqueoRequestApi,
  accessToken: string,
): Promise<BloqueoApi[]> {
  console.log("[availability/block] POST /api/availability/block →", body);

  const res = await fetch(apiUrl("/api/availability/block"), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[availability/block] POST /api/availability/block ${res.status} →`, raw);

  if (res.status === 409) throw new SlotOcupadoError("Alguno de los horarios ya está ocupado.");
  if (!res.ok) throw new Error("No se pudo crear el bloqueo.");
  return JSON.parse(raw) as BloqueoApi[];
}

export async function deleteBlock(id: string, accessToken: string): Promise<void> {
  console.log(`[availability/block] DELETE /api/availability/block/${id}`);

  const res = await fetch(apiUrl(`/api/availability/block/${id}`), {
    method: "DELETE",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[availability/block] DELETE /api/availability/block/${id} ${res.status} →`, raw);

  if (!res.ok) throw new Error("No se pudo eliminar el bloqueo.");
}
