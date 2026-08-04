import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class ReservasError extends Error {}

// ── Formas del backend (ApiTesis) ───────────────────────────────────────────────
// El swagger solo publica los *Request* de este módulo; las respuestas
// (ReservaResponse / ReservaDetalleResponse) no tienen schema documentado.
// Se infieren de las descripciones de los endpoints y la convención ya
// observada en el resto de la API (campos planos, camelCase). Confirmar con
// los logs de `readAndLog` y ajustar solo estos tipos si no calzan.

export type EstadoReservaApi = "pendiente" | "confirmada" | "reagendada" | "cancelada" | "finalizada";
export type EstadoPagoApi = "pendiente" | "pagado_parcialmente" | "pagado" | "reembolsado";
export type AsistenciaApi = "no_registrado" | "asistio" | "no_asistio";

export type ReservaClienteApi = {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
};

export type ReservaPagoApi = {
  total: number;
  pagado: number;
  pendiente: number;
  fechaUltimoPago: string | null;
};

export type ReservaResponseApi = {
  id: number;
  codigo: string | null;
  espacioId: number;
  espacioTitulo: string | null;
  cliente: ReservaClienteApi | null;
  fechaInicio: string;
  fechaFin: string;
  totalHoras: number;
  pax: number | null;
  estado: EstadoReservaApi;
  estadoPago: EstadoPagoApi;
  asistencia: AsistenciaApi;
  pago: ReservaPagoApi | null;
  fechaCreacion: string;
};

export type ReservaHistorialItemApi = {
  id: number | string;
  accion: string;
  detalle: string | null;
  fecha: string;
};

export type ReservaDetalleResponseApi = ReservaResponseApi & {
  notas: string | null;
  historial: ReservaHistorialItemApi[] | null;
};

/** `ReservaCancelacionResponse` — no formalizado como schema; el swagger solo confirma
 * el campo `estadoReverso` ("PROCESANDO" | "ERROR") sobre la forma habitual de `ReservaResponse`. */
export type ReservaCancelacionResponseApi = ReservaResponseApi & {
  estadoReverso: "PROCESANDO" | "ERROR" | null;
};

// A diferencia de otros módulos (tickets-soporte, financiero), este endpoint
// no usa el envelope Spring Pageable (content/totalElements/number) sino un
// formato propio ya "aplanado". Confirmado con los logs de `readAndLog`.
export type PagedResponseApi<T> = {
  items: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListReservasParamsApi = {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: EstadoReservaApi;
  estadoPago?: EstadoPagoApi;
  codigo?: string;
  cliente?: string;
  espacioId?: number;
  sortBy?: "fechaInicio" | "fechaCreacion" | "total" | "estado";
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
};

export type ReservasEstadisticasResponseApi = {
  totalReservasHoy: number;
  ingresosHoy: number;
  pendientesHoy: number;
  porcentajeOcupacion: number;
};

async function parseError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text();
  console.log(`[reservas-api] ERROR ${res.status} →`, raw);
  let msg: string | undefined;
  try {
    msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
  } catch {
    // body no-JSON
  }
  throw new ReservasError(msg ?? fallback);
}

/** Lee el body una sola vez, lo loguea crudo y lo parsea. TODO: quitar cuando se confirme la forma real. */
async function readAndLog<T>(res: Response, tag: string): Promise<T> {
  const raw = await res.text();
  console.log(`[reservas-api] ${tag} ${res.status} →`, raw);
  return (raw ? JSON.parse(raw) : null) as T;
}

function authHeaders(accessToken: string, withBody = false): HeadersInit {
  return withBody
    ? { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }
    : { Authorization: `Bearer ${accessToken}` };
}

/** GET /api/reservas */
export async function listReservas(
  params: ListReservasParamsApi,
  accessToken: string,
): Promise<PagedResponseApi<ReservaResponseApi>> {
  const qs = new URLSearchParams();
  if (params.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
  if (params.fechaHasta) qs.set("fechaHasta", params.fechaHasta);
  if (params.estado) qs.set("estado", params.estado);
  if (params.estadoPago) qs.set("estadoPago", params.estadoPago);
  if (params.codigo) qs.set("codigo", params.codigo);
  if (params.cliente) qs.set("cliente", params.cliente);
  if (params.espacioId != null) qs.set("espacioId", String(params.espacioId));
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortDir) qs.set("sortDir", params.sortDir);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));

  const res = await fetch(apiUrl(`/api/reservas?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar las reservas.");
  return readAndLog<PagedResponseApi<ReservaResponseApi>>(res, "GET /api/reservas");
}

/** GET /api/reservas/estadisticas */
export async function getEstadisticas(accessToken: string): Promise<ReservasEstadisticasResponseApi> {
  const res = await fetch(apiUrl("/api/reservas/estadisticas"), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar las estadísticas de reservas.");
  return readAndLog<ReservasEstadisticasResponseApi>(res, "GET /api/reservas/estadisticas");
}

/** GET /api/reservas/{id} */
export async function getReservaDetalle(id: number, accessToken: string): Promise<ReservaDetalleResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cargar el detalle de la reserva.");
  return readAndLog<ReservaDetalleResponseApi>(res, `GET /api/reservas/${id}`);
}

/** POST /api/reservas/{id}/confirmar */
export async function confirmarReserva(id: number, accessToken: string): Promise<ReservaResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}/confirmar`), {
    method: "POST",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo confirmar la reserva.");
  return readAndLog<ReservaResponseApi>(res, `POST /api/reservas/${id}/confirmar`);
}

/** POST /api/reservas/{id}/cancelar */
export async function cancelarReserva(
  id: number,
  motivo: string,
  accessToken: string,
): Promise<ReservaCancelacionResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}/cancelar`), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify({ motivo }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cancelar la reserva.");
  return readAndLog<ReservaCancelacionResponseApi>(res, `POST /api/reservas/${id}/cancelar`);
}

/** POST /api/reservas/{id}/reagendar */
export async function reagendarReserva(
  id: number,
  data: { fechaInicio: string; fechaFin: string },
  accessToken: string,
): Promise<ReservaResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}/reagendar`), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo reagendar la reserva.");
  return readAndLog<ReservaResponseApi>(res, `POST /api/reservas/${id}/reagendar`);
}

/** POST /api/reservas/{id}/asistencia */
export async function registrarAsistencia(
  id: number,
  asistencia: AsistenciaApi,
  accessToken: string,
): Promise<ReservaResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}/asistencia`), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify({ asistencia }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo registrar la asistencia.");
  return readAndLog<ReservaResponseApi>(res, `POST /api/reservas/${id}/asistencia`);
}

/** POST /api/reservas/{id}/pago */
export async function registrarPago(
  id: number,
  data: { monto: number; tipo: "parcial" | "total" | "reembolso"; notas?: string },
  accessToken: string,
): Promise<ReservaResponseApi> {
  const res = await fetch(apiUrl(`/api/reservas/${id}/pago`), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo registrar el pago.");
  return readAndLog<ReservaResponseApi>(res, `POST /api/reservas/${id}/pago`);
}
