import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class NegocioError extends Error {}

/** PUT /api/negocios/me — body (`NegocioRequest`). */
export type NegocioInput = {
  nombreNegocio: string;
  /** Catálogo SRI — si se omite, el backend usa "04" (RUC). */
  tipoIdentificacion?: string;
  numeroIdentificacion: string;
  razonSocial: string;
  direccion: string;
  categoria?: string;
  telefonoNegocio?: string;
  descripcion?: string;
  logoUrl?: string;
};

/** GET/PUT /api/negocios/me — shape de respuesta (no formalizado como schema propio en el swagger). */
export type NegocioDetalle = NegocioInput & {
  id?: string;
  usuarioId?: string;
};

/** GET /api/negocios/me — negocio del usuario autenticado. `null` si todavía no lo creó (404). */
export async function getNegocio(accessToken: string): Promise<NegocioDetalle | null> {
  const tag = "GET /api/negocios/me";
  const res = await fetch(apiUrl("/api/negocios/me"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[negocios-api] ${tag} ${res.status} →`, raw);

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new NegocioError("No se pudo obtener el negocio.");
  }
  return raw ? (JSON.parse(raw) as NegocioDetalle) : null;
}

/** PUT /api/negocios/me — crea o actualiza (upsert) el negocio del usuario autenticado. */
export async function upsertNegocio(accessToken: string, input: NegocioInput): Promise<NegocioDetalle> {
  const tag = "PUT /api/negocios/me";
  const res = await fetch(apiUrl("/api/negocios/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[negocios-api] ${tag} ${res.status} →`, raw);

  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
    } catch {
      // body no-JSON
    }
    throw new NegocioError(msg ?? "No se pudo guardar el negocio.");
  }

  return JSON.parse(raw) as NegocioDetalle;
}
