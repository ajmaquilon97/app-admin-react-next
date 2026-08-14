import "server-only";

import { SpacesError, type EspacioRequest, type EspacioResponse } from "@/lib/api/spaces";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

/** Extrae `{ message }` del body de error del backend; cae al texto por defecto si no lo hay. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    return ((await res.json()) as { message?: string }).message ?? fallback;
  } catch {
    return fallback; // body vacío o no-JSON
  }
}

/**
 * Escrituras que **solo** usa el módulo de espacios.
 *
 * Las lecturas compartidas (`getMisEspacios`, `getTiposEspacios`, `getEspacioById`) se quedan en
 * `lib/api/spaces.ts` porque las consumen varios dominios. `updateEspacio` también, y esa sí es una
 * excepción incómoda: configuración la usa para cambiar `modoConfirmacion`, porque
 * `PUT /api/espacios/{id}` no acepta un patch parcial y obliga a reenviar el espacio completo. En
 * cuanto el backend exponga un patch, `updateEspacio` puede bajar aquí y el módulo queda cerrado.
 *
 * Se re-exportan abajo las piezas compartidas que necesita `actions/spaces.ts`, para que el módulo
 * tenga una sola puerta de transporte. `SpacesError` debe ser **la misma clase** que lanza `lib/`:
 * la action discrimina con `instanceof` y una clase propia rompería esos cuatro `catch`.
 */
export { SpacesError, updateEspacio } from "@/lib/api/spaces";
export type { EspacioRequest, EspacioResponse } from "@/lib/api/spaces";

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
  if (!res.ok) throw new SpacesError(await errorMessage(res, "No se pudo crear el espacio."));
  return res.json() as Promise<EspacioResponse>;
}

/**
 * POST /api/espacios/{id}/activar — activa un espacio en estado "inactivo".
 * El backend valida que tenga al menos una modalidad de tarifa (hora, jornada,
 * evento o entrada) activa con precio > 0; si no, responde 409 con { message }.
 */
export async function activarEspacio(
  id: number,
  accessToken: string,
): Promise<EspacioResponse> {
  console.log(`[spaces-api] activarEspacio: invocando POST /api/espacios/${id}/activar`);
  const res = await fetch(apiUrl(`/api/espacios/${id}/activar`), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  console.log(`[spaces-api] activarEspacio: respuesta id=${id} status=${res.status} ok=${res.ok}`);

  if (!res.ok) {
    const msg = await errorMessage(res, "No se pudo activar el espacio.");
    console.warn(`[spaces-api] activarEspacio: rechazado id=${id} status=${res.status} message=${msg}`);
    throw new SpacesError(msg);
  }

  const body = (await res.json()) as EspacioResponse;
  console.log(`[spaces-api] activarEspacio: OK id=${id} estado devuelto=${body.estado} validarAforo=${body.validarAforo}`);
  return body;
}

/**
 * POST /api/espacios/{id}/inactivar — inactiva un espacio en estado "activo".
 * Simétrico a `/activar`. Solo el propietario o un usuario con rol "admin" puede
 * llamarlo (403 en otro caso); 409 si el espacio ya no está "activo". No afecta
 * reservas existentes — ver `docs/back_responses/feedback-frontend-inactivacion-espacios.md`.
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
  if (!res.ok) throw new SpacesError(await errorMessage(res, "No se pudo inactivar el espacio."));
  return res.json() as Promise<EspacioResponse>;
}
