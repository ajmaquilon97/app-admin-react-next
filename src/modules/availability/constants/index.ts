import type { Status } from "../types";

/**
 * Query keys del módulo.
 *
 * `all` es el prefijo compartido: otras features lo invalidan para reflejar
 * cambios que afectan la agenda (p. ej. `useBookingActions` tras confirmar,
 * cancelar o reagendar una reserva).
 */
export const availabilityKeys = {
  all: ["availability"] as const,
  serverNow: ["availability", "server-now"] as const,
  blocks: (espacioId: number, fechaInicio: string, fechaFin: string) =>
    ["availability", "blocks", espacioId, fechaInicio, fechaFin] as const,
  statistics: (espacioId: number, fechaInicio: string, fechaFin: string) =>
    ["availability", "statistics", espacioId, fechaInicio, fechaFin] as const,
  schedule: (espacioId: number) => ["availability", "schedule", espacioId] as const,
  exceptions: (espacioId: number) => ["availability", "exceptions", espacioId] as const,
  aforoSemana: (espacioId: number, fechaInicio: string, fechaFin: string) =>
    ["availability", "aforo", "semana", espacioId, fechaInicio, fechaFin] as const,
  aforoDia: (espacioId: number, fecha: string) =>
    ["availability", "aforo", "dia", espacioId, fecha] as const,
};

export const STATUS_LABELS: Record<Status, string> = {
  available: "Disponible",
  reserved: "Reservado",
  blocked: "Bloqueado",
  maintenance: "Mantenimiento",
  closed: "Cerrado",
};

export function getStatusClasses(status: Status): string {
  switch (status) {
    case "available":
      return "bg-white border-gray-200 hover:border-primary hover:shadow-sm group cursor-pointer";
    case "reserved":
      return "bg-primary text-white shadow-sm hover:bg-primary-hover cursor-pointer";
    case "blocked":
      return "bg-gray-100 text-text-muted border-gray-200 hover:bg-gray-200 cursor-pointer";
    case "maintenance":
      return "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20 cursor-pointer";
    case "closed":
      return "bg-error/10 border-error/30 text-error hover:bg-error/20 cursor-default";
    default:
      return "bg-white";
  }
}

export function getStatusDotColor(status: Status): string {
  switch (status) {
    case "available":   return "bg-success";
    case "reserved":    return "bg-white/70";
    case "blocked":     return "bg-gray-400";
    case "maintenance": return "bg-warning";
    case "closed":      return "bg-error";
  }
}

export const EXCEPTION_TYPE_COLOR: Record<string, string> = {
  feriado: "bg-error",
  mantenimiento: "bg-warning",
  cierre: "bg-gray-400",
};
