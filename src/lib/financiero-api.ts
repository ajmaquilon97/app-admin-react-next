import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class FinancieroError extends Error {}

export type PagedResponseApi<T> = {
  content: T[] | null;
  totalElements: number;
  totalPages: number;
  number: number;
};

/** `GET /api/financiero/resumen` — schema confirmado (`FinancieroResumenResponse`). */
export type FinancieroResumenApi = {
  ingresosMes: number;
  variacionIngresos: number | null;
  facturasAutorizadas: number;
  facturasConError: number;
  totalReversado: number;
  serieIngresos: { fecha: string; monto: number }[] | null;
};

export type InvoiceStatusApi =
  | "Procesando"
  | "Recibida"
  | "Autorizada"
  | "Devuelta"
  | "No autorizada"
  | "Error";

/**
 * `GET /api/financiero/ingresos` — el swagger solo confirma `PagedResponse<IngresoItemDto>`
 * sin desglose de campos. Shape inferida de `docs/backend-financiero-spec.md §2`.
 * Confirmar con los logs (`readAndLog`) y ajustar si no calza.
 */
export type IngresoItemApi = {
  id: string;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  spaceId: string;
  spaceName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  invoiceStatus: InvoiceStatusApi | null;
  invoiceId: string | null;
};

/**
 * `GET /api/facturas` — el swagger solo confirma `PagedResponse<FacturaItemDto>` sin
 * desglose de campos. Shape inferida de `docs/backend-financiero-spec.md §3.1`.
 */
export type FacturaItemApi = {
  id: string;
  bookingId: string;
  bookingCode: string;
  numeroComprobante: string;
  claveAcceso: string;
  clientName: string;
  clientIdentification: string;
  fechaEmision: string;
  fechaAutorizacion: string | null;
  estado: InvoiceStatusApi;
  subtotal: number;
  iva: number;
  total: number;
  ridePdfUrl: string | null;
  motivoRechazo: string | null;
};

/** `POST /api/facturas/{id}/reintentar` — 202 Accepted, shape inferida. */
export type ReintentarFacturaApi = {
  id: string;
  estado: InvoiceStatusApi;
};

/** Catálogo real confirmado en `GET /api/reversos` — no incluye distinción NotaCredito/ReversoPago. */
export type NotaCreditoEstadoApi = "procesando" | "enviada" | "autorizada" | "rechazada" | "anulada";

/**
 * `GET /api/reversos` — devuelve `PagedResponse<NotaCreditoResponse>`; el swagger confirma
 * el endpoint y el catálogo de `estado`, pero no el resto de los campos — inferidos de
 * `docs/backend-financiero-spec.md §4` (sin el campo `tipo`, que no existe en este endpoint).
 */
export type NotaCreditoResponseApi = {
  id: string;
  facturaId: string | null;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  monto: number;
  motivo: string;
  estado: NotaCreditoEstadoApi;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  claveAcceso: string | null;
};

export type FinancieroListParamsApi = {
  search?: string;
  spaceId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
};

async function parseError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text();
  console.log(`[financiero-api] ERROR ${res.status} →`, raw);
  let msg: string | undefined;
  try {
    msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
  } catch {
    // body no-JSON
  }
  throw new FinancieroError(msg ?? fallback);
}

async function readAndLog<T>(res: Response, tag: string): Promise<T> {
  const raw = await res.text();
  console.log(`[financiero-api] ${tag} ${res.status} →`, raw);
  return (raw ? JSON.parse(raw) : null) as T;
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

/** GET /api/financiero/resumen */
export async function getResumen(
  params: { from?: string; to?: string },
  accessToken: string,
): Promise<FinancieroResumenApi> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const res = await fetch(apiUrl(`/api/financiero/resumen?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cargar el resumen financiero.");
  return readAndLog<FinancieroResumenApi>(res, "GET /api/financiero/resumen");
}

/** GET /api/financiero/ingresos */
export async function getIngresos(
  params: FinancieroListParamsApi,
  accessToken: string,
): Promise<PagedResponseApi<IngresoItemApi>> {
  const qs = new URLSearchParams();
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));

  const res = await fetch(apiUrl(`/api/financiero/ingresos?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar los ingresos.");
  return readAndLog<PagedResponseApi<IngresoItemApi>>(res, "GET /api/financiero/ingresos");
}

/** GET /api/facturas */
export async function getFacturas(
  params: FinancieroListParamsApi,
  accessToken: string,
): Promise<PagedResponseApi<FacturaItemApi>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));

  const res = await fetch(apiUrl(`/api/facturas?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar las facturas.");
  return readAndLog<PagedResponseApi<FacturaItemApi>>(res, "GET /api/facturas");
}

/** POST /api/facturas/{id}/reintentar */
export async function reintentarFactura(id: string, accessToken: string): Promise<ReintentarFacturaApi> {
  const res = await fetch(apiUrl(`/api/facturas/${id}/reintentar`), {
    method: "POST",
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo reintentar la factura.");
  return readAndLog<ReintentarFacturaApi>(res, `POST /api/facturas/${id}/reintentar`);
}

/** GET /api/reversos */
export async function getReversos(
  params: { estado?: NotaCreditoEstadoApi; from?: string; to?: string; page?: number; size?: number },
  accessToken: string,
): Promise<PagedResponseApi<NotaCreditoResponseApi>> {
  const qs = new URLSearchParams();
  if (params.estado) qs.set("estado", params.estado);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));

  const res = await fetch(apiUrl(`/api/reversos?${qs.toString()}`), {
    headers: authHeaders(accessToken),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudieron cargar los reversos.");
  return readAndLog<PagedResponseApi<NotaCreditoResponseApi>>(res, "GET /api/reversos");
}
