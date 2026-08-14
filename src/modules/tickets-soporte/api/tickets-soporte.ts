import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class TicketsSoporteError extends Error {}

// El swagger solo publica *Request* de este módulo (`TicketResolverRequest`); la
// respuesta (`TicketSoporteResponse`) no tiene schema documentado — se infiere del
// modelo `TicketSoporteReserva` descrito en la spec (Id, ReservaId, ClienteId,
// Descripcion, Estado, ResolucionNotas, CreatedAt, ResueltoAt) y la convención
// camelCase del resto de la API. Confirmar con los logs y ajustar si no calza.

export type TicketEstadoApi = "abierto" | "en_revision" | "aprobado" | "rechazado";

export type TicketSoporteResponseApi = {
  id: string;
  reservaId: number;
  /** Código de la reserva — no confirmado si el backend lo embebe en este response. */
  reservaCodigo: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  descripcion: string;
  estado: TicketEstadoApi;
  resolucionNotas: string | null;
  fechaCreacion: string;
  resueltoAt: string | null;
};

export type PagedResponseApi<T> = {
  content: T[] | null;
  totalElements: number;
  totalPages: number;
  number: number;
};

export type ListTicketsParamsApi = {
  estado?: TicketEstadoApi;
  page?: number;
  size?: number;
};

async function parseError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text();
  console.log(`[tickets-soporte-api] ERROR ${res.status} →`, raw);
  let msg: string | undefined;
  try {
    msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
  } catch {
    // body no-JSON
  }
  throw new TicketsSoporteError(msg ?? fallback);
}

async function readAndLog<T>(res: Response, tag: string): Promise<T> {
  const raw = await res.text();
  console.log(`[tickets-soporte-api] ${tag} ${res.status} →`, raw);
  return (raw ? JSON.parse(raw) : null) as T;
}

function authHeaders(accessToken: string, withBody = false): HeadersInit {
  return withBody
    ? { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }
    : { Authorization: `Bearer ${accessToken}` };
}

/** GET /api/tickets-soporte — solo Admin/Staff. */
export async function listTicketsSoporte(
  params: ListTicketsParamsApi,
  accessToken: string,
): Promise<PagedResponseApi<TicketSoporteResponseApi>> {
  const qs = new URLSearchParams();
  if (params.estado) qs.set("estado", params.estado);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));

  const res = await fetch(apiUrl(`/api/tickets-soporte?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar los tickets de soporte.");
  return readAndLog<PagedResponseApi<TicketSoporteResponseApi>>(res, "GET /api/tickets-soporte");
}

/** POST /api/tickets-soporte/{id}/resolver — solo Admin/Staff. */
export async function resolverTicket(
  id: string,
  data: { aprobado: boolean; notas: string },
  accessToken: string,
): Promise<TicketSoporteResponseApi> {
  const res = await fetch(apiUrl(`/api/tickets-soporte/${id}/resolver`), {
    method: "POST",
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo resolver el ticket.");
  return readAndLog<TicketSoporteResponseApi>(res, `POST /api/tickets-soporte/${id}/resolver`);
}
