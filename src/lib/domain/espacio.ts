/**
 * Espacio en su forma reducida "opción de selector" — el vocabulario compartido
 * por reservas, financiero, tarifas, disponibilidad y configuración.
 *
 * Unifica cinco formas que convivían duplicadas: `SpaceOption` (bookings, financiero),
 * `EspacioOption` (configuracion, pricing) y `HeaderSpaceOption` (components/ui).
 *
 * `id` es `number` porque así lo devuelve el backend (`EspacioResponse.id`, ver
 * `lib/api/spaces-api.ts`). La conversión desde el string del DOM ocurre en un solo
 * sitio: `components/ui/HeaderSpaceSelector.tsx`.
 */
export interface EspacioOption {
  id: number;
  nombre: string;
  tipoEspacioNombre?: string | null;
  /** "franja_exclusiva" | "cupo_compartido" — solo lo puebla /tarifas, que deriva el archetype. */
  modalidadReserva?: string | null;
}
