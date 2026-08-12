/**
 * API pública del módulo de reservas.
 *
 * Todo lo que no se exporte aquí es interno: componentes de UI, hooks, transporte
 * y el mapeo backend→dominio. Ningún otro módulo debe importar de `bookings/*`.
 */
export { ReservasModule } from "./components/ReservasModule";
export { getStatistics } from "./actions/reservas";
export type { Booking, BookingDetail, BookingStatus, BookingFilters } from "./types";
