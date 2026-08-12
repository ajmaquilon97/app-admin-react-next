import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class CatalogosError extends Error {}

export type CiudadCatalogo = {
  id: number;
  nombre: string;
};

export type ProvinciaCatalogo = {
  id: number;
  nombre: string;
  ciudades: CiudadCatalogo[];
};

/** GET /api/catalogos/ubicaciones — endpoint público (sin JWT): provincias de Ecuador con sus ciudades. */
export async function getUbicaciones(): Promise<ProvinciaCatalogo[]> {
  const tag = "GET /api/catalogos/ubicaciones";
  const res = await fetch(apiUrl("/api/catalogos/ubicaciones"), {
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[catalogos-api] ${tag} ${res.status} →`, raw);

  if (!res.ok) {
    throw new CatalogosError("No se pudo obtener el catálogo de ubicaciones.");
  }

  const data = raw ? (JSON.parse(raw) as Array<{ id: number; nombre: string | null; ciudades: Array<{ id: number; nombre: string | null }> | null }>) : [];
  return data.map((p) => ({
    id: p.id,
    nombre: p.nombre ?? "",
    ciudades: (p.ciudades ?? []).map((c) => ({ id: c.id, nombre: c.nombre ?? "" })),
  }));
}
