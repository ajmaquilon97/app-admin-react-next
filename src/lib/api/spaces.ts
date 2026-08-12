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
  /** "franja_exclusiva" | "cupo_compartido" — ver src/lib/espacio-archetype.ts. */
  modalidadReserva: string | null;
};

export type EspacioRequest = {
  titulo: string;
  descripcion: string;
  propietarioId: string;
  tipoEspacioId: number;
  provinciaId?: number;
  ciudadId?: number;
  linkUbicacion: string;
  referencia: string;
  latitud?: number;
  longitud?: number;
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
  provinciaId: number | null;
  provinciaNombre: string | null;
  ciudadId: number | null;
  ciudadNombre: string | null;
  linkUbicacion: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
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
  const res = await fetch(apiUrl("/api/espacios/mis-espacios"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new SpacesError("No se pudo cargar tus espacios.");
  return res.json() as Promise<EspacioResponse[]>;
}

/**
 * PUT /api/espacios/{id} — actualiza un espacio existente.
 *
 * Vive aquí y no en `modules/spaces/api/` porque configuración también la usa: cambiar
 * `modoConfirmacion` obliga a reenviar el espacio completo, ya que el endpoint no acepta
 * un patch parcial. Con un patch en el backend, esta función baja al módulo.
 */
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

// `createEspacio`, `activarEspacio` e `inactivarEspacio` viven en `modules/spaces/api/spaces.ts`:
// solo las usa ese módulo.
