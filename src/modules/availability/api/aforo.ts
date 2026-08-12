import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class AforoError extends Error {}

export type AforoDiaResponseApi = {
  fecha: string; // YYYY-MM-DD
  capacidadTotal: number;
  vendida: number;
  disponible: number;
};

export type AforoTicketApi = {
  reservaId: number;
  nombreCliente: string;
  pax: number;
  horaCompra: string; // ISO 8601
};

export type AforoDiaDetalleResponseApi = AforoDiaResponseApi & {
  tickets: AforoTicketApi[];
};

async function parseError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text();
  let msg: string | undefined;
  try {
    msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
  } catch {
    // body no-JSON
  }
  throw new AforoError(msg ?? fallback);
}

/** GET /api/aforo?espacioId&fechaInicio&fechaFin — resumen de aforo por día en el rango. */
export async function getAforo(
  espacioId: number,
  fechaInicio: string,
  fechaFin: string,
  accessToken: string,
): Promise<AforoDiaResponseApi[]> {
  const params = new URLSearchParams({ espacioId: String(espacioId), fechaInicio, fechaFin });
  const res = await fetch(apiUrl(`/api/aforo?${params}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cargar el aforo del espacio.");
  return res.json() as Promise<AforoDiaResponseApi[]>;
}

/** GET /api/aforo/dia?espacioId&fecha — resumen + detalle de tickets de un día. */
export async function getAforoDia(
  espacioId: number,
  fecha: string,
  accessToken: string,
): Promise<AforoDiaDetalleResponseApi> {
  const params = new URLSearchParams({ espacioId: String(espacioId), fecha });
  const res = await fetch(apiUrl(`/api/aforo/dia?${params}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cargar el detalle de aforo del día.");
  return res.json() as Promise<AforoDiaDetalleResponseApi>;
}
