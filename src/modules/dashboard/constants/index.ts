import { MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import type { Kpi } from "../types";

export const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-secondary/10 text-secondary",
  "bg-gray-200 text-gray-600",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
];

export const ESTADO_MAP: Record<string, { label: string; style: string; dot: string }> = {
  confirmada:     { label: "Confirmada", style: "bg-success/10 text-success border-success/20", dot: "bg-success"  },
  pendiente_pago: { label: "Pend. Pago", style: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning"  },
  finalizada:     { label: "Finalizada", style: "bg-gray-100 text-text-muted border-gray-200",  dot: "bg-gray-400" },
  cancelada:      { label: "Cancelada",  style: "bg-error/10 text-error border-error/20",       dot: "bg-error"    },
};

/** Presentación de cada KPI, sin el dato. El valor lo rellena `api/loader.ts`. */
export const KPI_SHELLS: Omit<Kpi, "value" | "tag">[] = [
  { label: "Total de Espacios",   icon: MapPin,     iconColor: "text-info",    iconBg: "bg-info/10" },
  { label: "Reservas Hoy",        icon: Calendar,   iconColor: "text-primary", iconBg: "bg-primary/10" },
  { label: "Pendientes de Pago",  icon: Clock,      iconColor: "text-warning", iconBg: "bg-warning/10" },
  { label: "Ingresos del Mes",    icon: DollarSign, iconColor: "text-success", iconBg: "bg-success/10" },
];

/** KPIs sin datos — se muestran cuando la carga falla, en vez de dejar la fila vacía. */
export const EMPTY_KPIS: Kpi[] = KPI_SHELLS.map((k) => ({
  ...k,
  value: "—",
  tag: { text: "—", tone: "muted" as const },
}));
