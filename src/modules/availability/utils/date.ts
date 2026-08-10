/**
 * Helpers de fecha del módulo de disponibilidad.
 *
 * Extraídos de `lib/availability-mock.ts` al migrar la feature a `modules/`:
 * ese archivo mezclaba estos helpers (en uso real) con un backend simulado que
 * quedó muerto cuando `actions/availability.ts` pasó a llamar al backend real.
 */

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Fecha en formato "YYYY-MM-DD". */
export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Lunes de la semana a la que pertenece `date`, a las 00:00. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Los 7 días de la semana que arranca en `weekStart`. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isToday(date: Date): boolean {
  return formatISODate(date) === formatISODate(new Date());
}
