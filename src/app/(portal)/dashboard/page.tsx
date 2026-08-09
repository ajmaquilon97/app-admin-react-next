import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  MoreVertical,
  Filter,
  Download,
  type LucideIcon,
} from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import {
  getDashboardStats,
  getReservas,
  type DashboardStats,
  type ReservaResponse,
} from "@/lib/dashboard-api";

// ── Helpers de formato ────────────────────────────────────────────────────────

const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"] as const;

function utcParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),      // 0-based
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function formatHHMM(iso: string) {
  const { hours, minutes } = utcParts(iso);
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function todayUTCStr() { return new Date().toISOString().slice(0, 10); }

function isoToDateStr(iso: string) { return iso.slice(0, 10); }

function formatMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function initials(nombre: string | null) {
  if (!nombre) return "?";
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

// ── Tipos locales ─────────────────────────────────────────────────────────────

type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  tag: { text: string; tone: "success" | "warning" | "muted" };
};

type ChartBar = { month: string; height: number; value: string; color: string };

type UpcomingItem = {
  day: string;
  monthLabel: string;
  monthColor: string;
  space: string;
  time: string;
  initials_: string;
  client: string;
};

type TableRow = {
  initials_: string;
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

// ── Mapeo de datos ────────────────────────────────────────────────────────────

const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-secondary/10 text-secondary",
  "bg-gray-200 text-gray-600",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
];

const ESTADO_MAP: Record<string, { label: string; style: string; dot: string }> = {
  confirmada:      { label: "Confirmada",  style: "bg-success/10 text-success border-success/20",  dot: "bg-success"  },
  pendiente_pago:  { label: "Pend. Pago",  style: "bg-warning/10 text-warning border-warning/20",  dot: "bg-warning"  },
  finalizada:      { label: "Finalizada",  style: "bg-gray-100 text-text-muted border-gray-200",    dot: "bg-gray-400" },
  cancelada:       { label: "Cancelada",   style: "bg-error/10 text-error border-error/20",         dot: "bg-error"    },
};

function buildKpis(stats: DashboardStats): Kpi[] {
  return [
    {
      label: "Total de Espacios",
      value: String(stats.totalEspacios),
      icon: MapPin,
      iconColor: "text-info",
      iconBg: "bg-info/10",
      tag: { text: "Activos", tone: "muted" },
    },
    {
      label: "Reservas Hoy",
      value: String(stats.reservasHoy),
      icon: Calendar,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      tag: { text: "Hoy", tone: "muted" },
    },
    {
      label: "Pendientes de Pago",
      value: String(stats.pendientesPago),
      icon: Clock,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
      tag: { text: stats.pendientesPago > 0 ? "Requieren acción" : "Al día", tone: stats.pendientesPago > 0 ? "warning" : "muted" },
    },
    {
      label: "Ingresos del Mes",
      value: formatMoney(stats.ingresosMes),
      icon: DollarSign,
      iconColor: "text-success",
      iconBg: "bg-success/10",
      tag: { text: "Mes actual", tone: "success" },
    },
  ];
}

function buildChart(stats: DashboardStats): ChartBar[] {
  const meses = stats.reservasPorMes ?? [];
  if (meses.length === 0) return [];
  const maxVal = Math.max(...meses.map((m) => m.total), 1);
  return meses.map((m, i) => {
    const monthNum = parseInt(m.mes.split("-")[1] ?? "1") - 1;
    return {
      month: MESES_CORTOS[monthNum] ?? m.mes,
      height: Math.max(Math.round((m.total / maxVal) * 82) + 5, 5),
      value: String(m.total),
      color: i === meses.length - 1 ? "bg-secondary" : "bg-primary/60",
    };
  });
}

function buildUpcoming(reservas: ReservaResponse[]): UpcomingItem[] {
  const today = todayUTCStr();
  return reservas.map((r) => {
    const dateStr = isoToDateStr(r.fechaInicio);
    const { day, month } = utcParts(r.fechaInicio);
    const isToday = dateStr === today;
    const start = formatHHMM(r.fechaInicio);
    const end = formatHHMM(r.fechaFin);
    const hrs = r.totalHoras;
    return {
      day: pad2(day),
      monthLabel: isToday ? "HOY" : MESES_CORTOS[month]!,
      monthColor: isToday ? "text-error" : "text-primary",
      space: r.espacioTitulo ?? "—",
      time: `${start} - ${end} • ${hrs} hr${hrs !== 1 ? "s" : ""}`,
      initials_: initials(r.usuarioNombre),
      client: r.usuarioNombre ?? "—",
    };
  });
}

function buildTableRows(reservas: ReservaResponse[]): TableRow[] {
  const today = todayUTCStr();
  return reservas.map((r, i) => {
    const dateStr = isoToDateStr(r.fechaInicio);
    const { day, month } = utcParts(r.fechaInicio);
    const dateLabel = dateStr === today
      ? `Hoy, ${pad2(day)} ${MESES_CORTOS[month]}`
      : `${pad2(day)} ${MESES_CORTOS[month]}`;
    const start = formatHHMM(r.fechaInicio);
    const end = formatHHMM(r.fechaFin);
    const estado = ESTADO_MAP[r.estado ?? ""] ?? ESTADO_MAP.finalizada!;
    return {
      initials_: initials(r.usuarioNombre),
      avatarTone: AVATAR_TONES[i % AVATAR_TONES.length]!,
      name: r.usuarioNombre ?? "—",
      email: r.usuarioCorreo ?? "—",
      space: r.espacioTitulo ?? "—",
      dateLabel,
      time: `${start} - ${end}`,
      amount: r.monto != null ? `$${r.monto.toFixed(2)}` : "—",
      statusLabel: estado.label,
      statusStyle: estado.style,
      statusDot: estado.dot,
    };
  });
}

function tagClasses(tone: "success" | "warning" | "muted") {
  if (tone === "success") return "text-success bg-success/10";
  if (tone === "warning") return "text-warning bg-warning/10";
  return "text-text-muted";
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [user, tokens] = await Promise.all([verifySession(), getSessionTokens()]);
  const firstName = user.name.split(" ")[0];

  let stats: DashboardStats | null = null;
  let recentRows: TableRow[] = [];
  let upcomingItems: UpcomingItem[] = [];

  if (tokens) {
    const today = new Date().toISOString();
    const [statsResult, recentResult, upcomingResult] = await Promise.allSettled([
      getDashboardStats(tokens.accessToken),
      getReservas(tokens.accessToken, { size: 5 }),
      getReservas(tokens.accessToken, { fechaDesde: today, size: 3 }),
    ]);
    if (statsResult.status === "fulfilled") stats = statsResult.value;
    if (recentResult.status === "fulfilled")
      recentRows = buildTableRows(recentResult.value.items ?? []);
    if (upcomingResult.status === "fulfilled")
      upcomingItems = buildUpcoming(upcomingResult.value.items ?? []);
  }

  const kpis: Kpi[] = stats
    ? buildKpis(stats)
    : [
        { label: "Total de Espacios", value: "—", icon: MapPin, iconColor: "text-info", iconBg: "bg-info/10", tag: { text: "—", tone: "muted" } },
        { label: "Reservas Hoy", value: "—", icon: Calendar, iconColor: "text-primary", iconBg: "bg-primary/10", tag: { text: "—", tone: "muted" } },
        { label: "Pendientes de Pago", value: "—", icon: Clock, iconColor: "text-warning", iconBg: "bg-warning/10", tag: { text: "—", tone: "muted" } },
        { label: "Ingresos del Mes", value: "—", icon: DollarSign, iconColor: "text-success", iconBg: "bg-success/10", tag: { text: "—", tone: "muted" } },
      ];

  const chartBars: ChartBar[] = stats ? buildChart(stats) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="page-title">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-muted">
          Aquí tienes un resumen de la actividad de tu complejo hoy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
                <span className={`flex items-center rounded-full px-2 py-1 text-sm font-medium ${tagClasses(kpi.tag.tone)}`}>
                  {kpi.tag.tone === "success" && <TrendingUp className="mr-1 h-3 w-3" />}
                  {kpi.tag.text}
                </span>
              </div>
              <p className="text-sm font-medium text-text-muted">{kpi.label}</p>
              <h3 className="mt-1 text-3xl font-bold text-text-main">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Gráfico + Próximas reservas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="subtitle">Reservas por Mes</h2>
              <p className="text-sm text-text-muted">Comparativa de los últimos 6 meses</p>
            </div>
            <button className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {chartBars.length > 0 ? (
            <div className="relative mt-4 flex h-48 flex-1 items-end justify-between gap-2 border-b border-gray-100 pb-2 pt-4">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-full border-t border-dashed border-gray-200" />
                ))}
              </div>
              {chartBars.map((bar) => (
                <div key={bar.month} className="group z-10 flex w-1/6 flex-col items-center">
                  <div
                    className={`relative w-full rounded-t-md ${bar.color} transition-[height] duration-500`}
                    style={{ height: `${bar.height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-text-main px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {bar.value}
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-medium text-text-muted">{bar.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-text-muted">
              No hay datos de reservas aún.
            </div>
          )}
        </div>

        {/* Próximas reservas */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="subtitle">Próximas Reservas</h2>
            <a href="#" className="text-sm font-medium text-secondary transition-colors hover:text-primary">
              Ver todas
            </a>
          </div>

          {upcomingItems.length > 0 ? (
            <div className="flex-1 space-y-4">
              {upcomingItems.map((item, i) => (
                <div key={i} className="flex items-start rounded-xl border border-transparent bg-background p-3 transition-colors hover:border-gray-200">
                  <div className="mr-4 flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                    <span className={`text-xs font-semibold ${item.monthColor}`}>{item.monthLabel}</span>
                    <span className="modal-title leading-tight">{item.day}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-main">{item.space}</h4>
                    <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
                    <div className="mt-2 flex items-center">
                      <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                        {item.initials_}
                      </div>
                      <span className="text-xs font-medium text-text-main">{item.client}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
              Sin próximas reservas.
            </div>
          )}
        </div>
      </div>

      {/* Tabla de últimas reservas */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="subtitle">Últimas Reservas Generadas</h2>
            <p className="text-sm text-text-muted">Actividad reciente en tu portal.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-main hover:bg-gray-50">
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </button>
            <button className="flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text-main hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentRows.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-background">
                  {["Cliente", "Espacio", "Fecha / Hora", "Monto", "Estado"].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentRows.map((r, i) => (
                  <tr key={i} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${r.avatarTone}`}>
                          {r.initials_}
                        </div>
                        <div>
                          <p className="font-medium text-text-main">{r.name}</p>
                          <p className="text-xs text-text-muted">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-main">{r.space}</td>
                    <td className="px-6 py-4">
                      <p className="text-text-main">{r.dateLabel}</p>
                      <p className="text-xs text-text-muted">{r.time}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-main">{r.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${r.statusStyle}`}>
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${r.statusDot}`} />
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-text-muted hover:text-primary">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-text-muted">
              No hay reservas registradas aún.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 pb-8 text-center">
        <p className="text-xs text-text-muted">© 2026 RecreAdmin. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
