import "server-only";

import { getDashboardStats, getReservas, type DashboardStats, type ReservaResponse } from "./dashboard";
import { AVATAR_TONES, EMPTY_KPIS, ESTADO_MAP, KPI_SHELLS } from "../constants";
import {
  MESES_CORTOS,
  formatHHMM,
  formatMoney,
  initials,
  isoToDateStr,
  pad2,
  todayUTCStr,
  utcParts,
} from "../utils/format";
import type { ChartBar, DashboardData, Kpi, TableRow, UpcomingItem } from "../types";

// ── Mapeo backend → modelo de vista ─────────────────────────────────────────────

function toKpis(stats: DashboardStats): Kpi[] {
  const pendientes = stats.pendientesPago;
  const tags: Kpi["tag"][] = [
    { text: "Activos", tone: "muted" },
    { text: "Hoy", tone: "muted" },
    pendientes > 0
      ? { text: "Requieren acción", tone: "warning" }
      : { text: "Al día", tone: "muted" },
    { text: "Mes actual", tone: "success" },
  ];
  const values = [
    String(stats.totalEspacios),
    String(stats.reservasHoy),
    String(pendientes),
    formatMoney(stats.ingresosMes),
  ];
  return KPI_SHELLS.map((shell, i) => ({ ...shell, value: values[i]!, tag: tags[i]! }));
}

function toChartBars(stats: DashboardStats): ChartBar[] {
  const meses = stats.reservasPorMes ?? [];
  if (meses.length === 0) return [];

  const maxVal = Math.max(...meses.map((m) => m.total), 1);
  return meses.map((m, i) => {
    const monthNum = parseInt(m.mes.split("-")[1] ?? "1") - 1;
    return {
      month: MESES_CORTOS[monthNum] ?? m.mes,
      // 5% mínimo para que un mes en cero siga siendo visible como barra.
      height: Math.max(Math.round((m.total / maxVal) * 82) + 5, 5),
      value: String(m.total),
      color: i === meses.length - 1 ? "bg-secondary" : "bg-primary/60",
    };
  });
}

function toUpcoming(reservas: ReservaResponse[]): UpcomingItem[] {
  const today = todayUTCStr();
  return reservas.map((r) => {
    const { day, month } = utcParts(r.fechaInicio);
    const isToday = isoToDateStr(r.fechaInicio) === today;
    const hrs = r.totalHoras;
    return {
      day: pad2(day),
      monthLabel: isToday ? "HOY" : MESES_CORTOS[month]!,
      monthColor: isToday ? "text-error" : "text-primary",
      space: r.espacioTitulo ?? "—",
      time: `${formatHHMM(r.fechaInicio)} - ${formatHHMM(r.fechaFin)} • ${hrs} hr${hrs !== 1 ? "s" : ""}`,
      initials: initials(r.usuarioNombre),
      client: r.usuarioNombre ?? "—",
    };
  });
}

function toTableRows(reservas: ReservaResponse[]): TableRow[] {
  const today = todayUTCStr();
  return reservas.map((r, i) => {
    const { day, month } = utcParts(r.fechaInicio);
    const fecha = `${pad2(day)} ${MESES_CORTOS[month]}`;
    const estado = ESTADO_MAP[r.estado ?? ""] ?? ESTADO_MAP.finalizada!;
    return {
      initials: initials(r.usuarioNombre),
      avatarTone: AVATAR_TONES[i % AVATAR_TONES.length]!,
      name: r.usuarioNombre ?? "—",
      email: r.usuarioCorreo ?? "—",
      space: r.espacioTitulo ?? "—",
      dateLabel: isoToDateStr(r.fechaInicio) === today ? `Hoy, ${fecha}` : fecha,
      time: `${formatHHMM(r.fechaInicio)} - ${formatHHMM(r.fechaFin)}`,
      amount: r.monto != null ? `$${r.monto.toFixed(2)}` : "—",
      statusLabel: estado.label,
      statusStyle: estado.style,
      statusDot: estado.dot,
    };
  });
}

// ── Carga ───────────────────────────────────────────────────────────────────────

const EMPTY: DashboardData = { kpis: EMPTY_KPIS, chartBars: [], upcoming: [], recent: [] };

/**
 * Carga las tres fuentes del dashboard y las deja listas para pintar.
 *
 * Usa `allSettled` a propósito: cada bloque de la pantalla es independiente, así que si
 * falla el de estadísticas los otros dos siguen mostrándose. Recibe el token en vez de
 * resolverlo — igual que `lib/api/espacios-catalogo.ts`, ver §4 de architecture.md.
 */
export async function loadDashboardData(accessToken: string | null): Promise<DashboardData> {
  if (!accessToken) return EMPTY;

  const [statsResult, recentResult, upcomingResult] = await Promise.allSettled([
    getDashboardStats(accessToken),
    getReservas(accessToken, { size: 5 }),
    getReservas(accessToken, { fechaDesde: new Date().toISOString(), size: 3 }),
  ]);

  return {
    kpis: statsResult.status === "fulfilled" ? toKpis(statsResult.value) : EMPTY_KPIS,
    chartBars: statsResult.status === "fulfilled" ? toChartBars(statsResult.value) : [],
    recent: recentResult.status === "fulfilled" ? toTableRows(recentResult.value.items ?? []) : [],
    upcoming: upcomingResult.status === "fulfilled" ? toUpcoming(upcomingResult.value.items ?? []) : [],
  };
}
