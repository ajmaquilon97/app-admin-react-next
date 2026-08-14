/**
 * Espacio en su forma de lectura ligera — el vocabulario compartido por reservas,
 * financiero, tarifas, disponibilidad y configuración.
 *
 * Unifica cinco formas que convivían duplicadas: `SpaceOption` (bookings, financiero),
 * `EspacioOption` (configuracion, pricing), `HeaderSpaceOption` (components/ui) y
 * `Espacio` (availability).
 *
 * `id` es `number` porque así lo devuelve el backend (`EspacioResponse.id`, ver
 * `lib/api/spaces.ts`). La conversión desde el string del DOM ocurre en un solo
 * sitio: `components/ui/HeaderSpaceSelector.tsx`.
 *
 * Se construye en un único lugar: `lib/api/espacios-catalogo.ts`.
 */
export interface EspacioOption {
  id: number;
  nombre: string;
  tipoEspacioNombre: string | null;
  /**
   * "franja_exclusiva" | "cupo_compartido" — no viene en el espacio, sale de un join
   * contra el catálogo de tipos. Pásalo por `getArchetype()` en vez de compararlo a mano.
   */
  modalidadReserva: string | null;
  maxCapacidad: number;
  validarAforo: boolean;
}
