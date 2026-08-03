import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class SpacesError extends Error {}

export type TipoEspacio = {
  id: number;
  codigo: string | null;
  nombre: string | null;
};

export type EspacioRequest = {
  titulo: string;
  descripcion: string;
  propietarioId: string;
  tipoEspacioId: number;
  ciudad: string;
  provincia: string;
  linkUbicacion: string;
  referencia: string;
  validarAforo: boolean;
  maxCapacidad: number;
  imagenPortada?: string;
  imagenesGaleria?: string[];
  /** "inmediata" | "pago_confirmacion_manual" | "solicitud_aprobacion" — ver src/modules/configuracion/types. */
  modoConfirmacion?: string;
};

export type EspacioEstado = "activo" | "inactivo" | "revision";

export type EspacioResponse = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  propietarioId: string | null;
  propietarioNombre: string | null;
  tipoEspacioId: number;
  tipoEspacioNombre: string | null;
  ciudad: string | null;
  provincia: string | null;
  linkUbicacion: string | null;
  referencia: string | null;
  validarAforo: boolean;
  maxCapacidad: number;
  imagenPortada: string | null;
  imagenesGaleria: string[] | null;
  fechaCreacion: string;
  estado: EspacioEstado | null;
  calificacion: number | null;
  totalResenas: number | null;
  modoConfirmacion: string | null;
};

/** GET /api/tipos-espacios — catálogo público de tipos de espacio. */
export async function getTiposEspacios(): Promise<TipoEspacio[]> {
  const res = await fetch(apiUrl("/api/tipos-espacios"), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new SpacesError("No se pudo cargar el catálogo de tipos de espacio.");
  return res.json() as Promise<TipoEspacio[]>;
}

/** GET /api/espacios/{id} — detalle de un espacio. */
export async function getEspacioById(
  id: number,
  accessToken: string,
): Promise<EspacioResponse> {
  const res = await fetch(apiUrl(`/api/espacios/${id}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new SpacesError("No se pudo cargar el espacio.");
  return res.json() as Promise<EspacioResponse>;
}

/** GET /api/espacios/mis-espacios — espacios del anfitrión autenticado. */
export async function getMisEspacios(accessToken: string): Promise<EspacioResponse[]> {
  console.log("Access Token from getMisEspacios: ",accessToken)
  const res = await fetch(apiUrl("/api/espacios/mis-espacios"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new SpacesError("No se pudo cargar tus espacios.");
  return res.json() as Promise<EspacioResponse[]>;
}

/** POST /api/espacios — crea un espacio. Requiere access token JWT. */
export async function createEspacio(
  data: EspacioRequest,
  accessToken: string,
): Promise<EspacioResponse> {
  const res = await fetch(apiUrl("/api/espacios"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = ((await res.json()) as { message?: string }).message;
    } catch {
      // body vacío o no-JSON
    }
    throw new SpacesError(msg ?? "No se pudo crear el espacio.");
  }
  return res.json() as Promise<EspacioResponse>;
}

/** PUT /api/espacios/{id} — actualiza un espacio existente. */
export async function updateEspacio(
  id: number,
  data: EspacioRequest,
  accessToken: string,
): Promise<EspacioResponse> {
  const res = await fetch(apiUrl(`/api/espacios/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) {
    let msg: string | undefined;
    try { msg = ((await res.json()) as { message?: string }).message; } catch { /* vacío */ }
    throw new SpacesError(msg ?? "No se pudo actualizar el espacio.");
  }
  return res.json() as Promise<EspacioResponse>;
}

/**
 * POST /api/espacios/{id}/activar — activa un espacio en estado "inactivo".
 * El backend valida que tenga al menos una modalidad de tarifa (hora, jornada
 * o evento) activa con precio > 0; si no, responde 409 con { message }.
 */
export async function activarEspacio(
  id: number,
  accessToken: string,
): Promise<EspacioResponse> {
  const res = await fetch(apiUrl(`/api/espacios/${id}/activar`), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = ((await res.json()) as { message?: string }).message;
    } catch {
      // body vacío o no-JSON
    }
    throw new SpacesError(msg ?? "No se pudo activar el espacio.");
  }
  return res.json() as Promise<EspacioResponse>;
}

/**
 * POST /api/espacios/{id}/inactivar — inactiva un espacio en estado "activo".
 * Propuesta pendiente de confirmación de backend, simétrica a `/activar` — ver
 * `docs/backend-inactivacion-espacios-spec.md`. Las reservas ya realizadas para el
 * espacio deben mantenerse; el backend debe dejar de aceptar reservas nuevas.
 */
export async function inactivarEspacio(
  id: number,
  accessToken: string,
): Promise<EspacioResponse> {
  const res = await fetch(apiUrl(`/api/espacios/${id}/inactivar`), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = ((await res.json()) as { message?: string }).message;
    } catch {
      // body vacío o no-JSON
    }
    throw new SpacesError(msg ?? "No se pudo inactivar el espacio.");
  }
  return res.json() as Promise<EspacioResponse>;
}
