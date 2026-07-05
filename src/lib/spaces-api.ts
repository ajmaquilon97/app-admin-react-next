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
  /** URL pública en S3 de la imagen de portada (pendiente en el backend). */
  imagenPortada?: string;
  /** URLs de hasta 7 imágenes adicionales de la galería (pendiente en el backend). */
  imagenesGaleria?: string[];
};

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
  fechaCreacion: string;
};

/** GET /api/tipos-espacios — catálogo público de tipos de espacio. */
export async function getTiposEspacios(): Promise<TipoEspacio[]> {
  const res = await fetch(apiUrl("/api/tipos-espacios"), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new SpacesError("No se pudo cargar el catálogo de tipos de espacio.");
  return res.json() as Promise<TipoEspacio[]>;
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
