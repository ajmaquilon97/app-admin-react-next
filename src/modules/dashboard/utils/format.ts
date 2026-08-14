/**
 * Formateo de fechas en **UTC a propósito**: el backend devuelve las horas de reserva ya
 * en la zona del negocio, así que convertirlas a la zona del navegador las desplazaría.
 */

export const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export function utcParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(), // 0-based
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatHHMM(iso: string): string {
  const { hours, minutes } = utcParts(iso);
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function todayUTCStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoToDateStr(iso: string): string {
  return iso.slice(0, 10);
}

/** Compacta a "$1.2k" a partir de mil; por debajo, sin decimales. */
export function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function initials(nombre: string | null): string {
  if (!nombre) return "?";
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}
