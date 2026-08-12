import "server-only";

import { getMisEspacios, getTiposEspacios } from "./spaces";
import type { EspacioOption } from "../domain";

/**
 * Catálogo de espacios del anfitrión en su forma de lectura ligera.
 *
 * Compone dos endpoints porque `modalidadReserva` no viene en el espacio sino en su
 * tipo: el join `espacioId → tipoEspacioId → modalidadReserva` se hacía a mano y por
 * duplicado en `/disponibilidad`, `/tarifas` y `bookings/actions/reservas.ts`. Aquí
 * ocurre una sola vez.
 *
 * Recibe el `accessToken` en vez de resolverlo: los Server Components y las actions de
 * dominio ya lo tienen en mano, y `getSessionTokens()` descifra el JWE en cada llamada.
 * La versión que sí resuelve la sesión es `actions/catalogo-espacios.ts`, para el cliente.
 */
export async function loadEspacioOptions(accessToken: string): Promise<EspacioOption[]> {
  const [espacios, tipos] = await Promise.all([getMisEspacios(accessToken), getTiposEspacios()]);
  const modalidadPorTipoId = new Map(tipos.map((t) => [t.id, t.modalidadReserva]));

  return espacios.map((e) => ({
    id: e.id,
    // Un espacio sin título se muestra como "Sin nombre" en vez de desaparecer del
    // selector: quedaría inaccesible para gestionarlo.
    nombre: e.titulo ?? "Sin nombre",
    tipoEspacioNombre: e.tipoEspacioNombre ?? null,
    modalidadReserva: modalidadPorTipoId.get(e.tipoEspacioId) ?? null,
    maxCapacidad: e.maxCapacidad,
    validarAforo: e.validarAforo,
  }));
}
