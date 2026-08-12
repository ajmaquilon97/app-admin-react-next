/**
 * Respuesta paginada del backend, compartida por todos los dominios.
 *
 * Vivía duplicada e idéntica en `modules/{bookings,financiero,tickets-soporte}/types`.
 * Cada uno de esos módulos la re-exporta para que sus imports internos (`../types`)
 * sigan funcionando sin acoplarse entre sí.
 */
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
