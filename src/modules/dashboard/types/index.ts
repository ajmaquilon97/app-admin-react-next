import type { LucideIcon } from "lucide-react";

/**
 * Modelo de vista del dashboard: no son entidades del backend sino filas y tarjetas ya
 * formateadas. El mapeo desde las respuestas de la API vive en `api/loader.ts`.
 */

export type KpiTone = "success" | "warning" | "muted";

export type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  tag: { text: string; tone: KpiTone };
};

export type ChartBar = { month: string; height: number; value: string; color: string };

export type UpcomingItem = {
  day: string;
  monthLabel: string;
  monthColor: string;
  space: string;
  time: string;
  initials: string;
  client: string;
};

export type TableRow = {
  initials: string;
  avatarTone: string;
  name: string;
  email: string;
  space: string;
  dateLabel: string;
  time: string;
  amount: string;
  statusLabel: string;
  statusStyle: string;
  statusDot: string;
};

/** Todo lo que la pantalla necesita, ya listo para pintar. */
export type DashboardData = {
  kpis: Kpi[];
  chartBars: ChartBar[];
  upcoming: UpcomingItem[];
  recent: TableRow[];
};
