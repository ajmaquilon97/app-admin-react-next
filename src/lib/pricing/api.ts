import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class PricingError extends Error {}

// ── Formas del backend (ApiTesis) ───────────────────────────────────────────────
// El swagger solo publica los *Request* de este módulo (Tarifas); las respuestas
// no tienen schema documentado. Asumimos que reflejan la misma forma plana del
// request + los campos identificadores (espacioId / id). Si el backend responde
// distinto, ajustar solo estos tipos y `fromApi*` — el resto de la app no cambia.

export type TarifaPorDiaApi = {
  dia: number;
  activo: boolean;
  precio: number | null;
};

export type EspacioPricingRequestApi = {
  horaActiva: boolean;
  horaPrecio: number | null;
  jornadaActiva: boolean;
  jornadaPrecio: number | null;
  eventoActiva: boolean;
  eventoPrecio: number | null;
  entradaActiva: boolean;
  entradaPrecio: number | null;
  tarifasPorDia: TarifaPorDiaApi[];
};

export type EspacioPricingResponseApi = EspacioPricingRequestApi & {
  espacioId: number;
  // El backend omite estos campos del JSON (no manda []) cuando no hay registros.
  fechasEspeciales?: FechaEspecialResponseApi[] | null;
  promociones?: PromocionResponseApi[] | null;
};

export type FechaEspecialRequestApi = {
  fecha: string; // "YYYY-MM-DD"
  descripcion: string;
  precio: number;
  modalidad: "hora" | "jornada" | "evento" | "entrada";
};

export type FechaEspecialResponseApi = FechaEspecialRequestApi & { id: string };

export type PromocionRequestApi = {
  nombre: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  activa: boolean;
  condicion?: string | null;
};

export type PromocionResponseApi = PromocionRequestApi & { id: string };

async function parseError(res: Response, fallback: string): Promise<never> {
  const raw = await res.text();
  console.log(`[pricing-api] ERROR ${res.status} →`, raw);
  let msg: string | undefined;
  try {
    msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
  } catch {
    // body no-JSON
  }
  throw new PricingError(msg ?? fallback);
}

/**
 * Lee el body una sola vez, lo loguea crudo (para confirmar la forma real de
 * la respuesta, ya que el swagger no la documenta) y lo parsea como JSON.
 * TODO: quitar estos logs una vez confirmada la forma de respuesta con backend.
 */
async function readAndLog<T>(res: Response, tag: string): Promise<T> {
  const raw = await res.text();
  console.log(`[pricing-api] ${tag} ${res.status} →`, raw);
  return (raw ? JSON.parse(raw) : null) as T;
}

/** GET /api/espacios/{espacioId}/tarifas */
export async function getEspacioTarifas(
  espacioId: number,
  accessToken: string,
): Promise<EspacioPricingResponseApi> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo cargar el tarifario del espacio.");
  return readAndLog<EspacioPricingResponseApi>(res, `GET .../${espacioId}/tarifas`);
}

/** PUT /api/espacios/{espacioId}/tarifas */
export async function saveEspacioTarifas(
  espacioId: number,
  data: EspacioPricingRequestApi,
  accessToken: string,
): Promise<EspacioPricingResponseApi> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo guardar el tarifario del espacio.");
  return readAndLog<EspacioPricingResponseApi>(res, `PUT .../${espacioId}/tarifas`);
}

/** POST /api/espacios/{espacioId}/tarifas/fechas-especiales */
export async function addFechaEspecial(
  espacioId: number,
  data: FechaEspecialRequestApi,
  accessToken: string,
): Promise<FechaEspecialResponseApi> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas/fechas-especiales`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo agregar la fecha especial.");
  return readAndLog<FechaEspecialResponseApi>(res, `POST .../${espacioId}/tarifas/fechas-especiales`);
}

/** DELETE /api/espacios/{espacioId}/tarifas/fechas-especiales/{id} */
export async function deleteFechaEspecial(
  espacioId: number,
  id: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas/fechas-especiales/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204) return parseError(res, "No se pudo eliminar la fecha especial.");
}

/** POST /api/espacios/{espacioId}/tarifas/promociones */
export async function addPromocion(
  espacioId: number,
  data: PromocionRequestApi,
  accessToken: string,
): Promise<PromocionResponseApi> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas/promociones`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo crear la promoción.");
  return readAndLog<PromocionResponseApi>(res, `POST .../${espacioId}/tarifas/promociones`);
}

/** PATCH /api/espacios/{espacioId}/tarifas/promociones/{id} */
export async function togglePromocion(
  espacioId: number,
  id: string,
  activa: boolean,
  accessToken: string,
): Promise<PromocionResponseApi> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas/promociones/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ activa }),
    cache: "no-store",
  });
  if (!res.ok) return parseError(res, "No se pudo actualizar la promoción.");
  return readAndLog<PromocionResponseApi>(res, `PATCH .../${espacioId}/tarifas/promociones/${id}`);
}

/** DELETE /api/espacios/{espacioId}/tarifas/promociones/{id} */
export async function deletePromocion(
  espacioId: number,
  id: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(apiUrl(`/api/espacios/${espacioId}/tarifas/promociones/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204) return parseError(res, "No se pudo eliminar la promoción.");
}
