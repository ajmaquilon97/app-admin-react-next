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

// — Datos mock (luego vendrán de Supabase) —

type Kpi = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  tag: { text: string; tone: "success" | "warning" | "muted" };
};

const KPIS: Kpi[] = [
  {
    label: "Total de Espacios",
    value: "12",
    icon: MapPin,
    iconColor: "text-info",
    iconBg: "bg-info/10",
    tag: { text: "+1", tone: "success" },
  },
  {
    label: "Reservas Hoy",
    value: "8",
    icon: Calendar,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    tag: { text: "Hoy", tone: "muted" },
  },
  {
    label: "Pendientes de Pago",
    value: "3",
    icon: Clock,
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
    tag: { text: "Requieren acción", tone: "warning" },
  },
  {
    label: "Ingresos (Octubre)",
    value: "$4,250",
    icon: DollarSign,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    tag: { text: "15%", tone: "success" },
  },
];

const CHART = [
  { month: "May", height: 40, color: "bg-primary/20" },
  { month: "Jun", height: 55, color: "bg-primary/40" },
  { month: "Jul", height: 70, color: "bg-primary/60" },
  { month: "Ago", height: 60, color: "bg-primary/80" },
  { month: "Sep", height: 85, color: "bg-primary", value: "124" },
  { month: "Oct", height: 45, color: "bg-secondary" },
];

const UPCOMING = [
  {
    day: "14",
    month: "HOY",
    monthColor: "text-error",
    space: "Cancha Sintética #1",
    time: "14:00 - 16:00 • 2 hrs",
    initials: "MA",
    client: "Martín Arias",
  },
  {
    day: "15",
    month: "OCT",
    monthColor: "text-primary",
    space: 'Salón de Eventos "El Lago"',
    time: "18:00 - 02:00 • 8 hrs",
    initials: "LR",
    client: "Laura Restrepo",
  },
  {
    day: "15",
    month: "OCT",
    monthColor: "text-primary",
    space: "Zona Camping (Parcela A)",
    time: "Check-in 11:00am",
    initials: "FJ",
    client: "Familia Jiménez",
  },
];

type Status = "Confirmada" | "Pend. Pago" | "Finalizada";

const RESERVATIONS: {
  initials: string;
  avatarTone: string;
  name: string;
  email: string;
  space: string;
  date: string;
  time: string;
  amount: string;
  status: Status;
}[] = [
  {
    initials: "DP",
    avatarTone: "bg-primary/10 text-primary",
    name: "Diego Pérez",
    email: "diego@email.com",
    space: "Cancha Sintética #2",
    date: "Hoy, 14 Oct",
    time: "20:00 - 21:00",
    amount: "$35.00",
    status: "Confirmada",
  },
  {
    initials: "AM",
    avatarTone: "bg-secondary/10 text-secondary",
    name: "Ana Martínez",
    email: "ana.m@email.com",
    space: "Piscina Familiar",
    date: "Mañana, 15 Oct",
    time: "Día completo",
    amount: "$120.00",
    status: "Pend. Pago",
  },
  {
    initials: "CJ",
    avatarTone: "bg-gray-200 text-gray-600",
    name: "Carlos Jaramillo",
    email: "carlos@email.com",
    space: "Complejo Deportivo (Total)",
    date: "Sáb, 18 Oct",
    time: "09:00 - 18:00",
    amount: "$450.00",
    status: "Finalizada",
  },
];

const STATUS_STYLES: Record<Status, string> = {
  Confirmada: "bg-success/10 text-success border-success/20",
  "Pend. Pago": "bg-warning/10 text-warning border-warning/20",
  Finalizada: "bg-gray-100 text-text-muted border-gray-200",
};

const STATUS_DOT: Record<Status, string> = {
  Confirmada: "bg-success",
  "Pend. Pago": "bg-warning",
  Finalizada: "bg-gray-400",
};

function tagClasses(tone: "success" | "warning" | "muted") {
  if (tone === "success") return "text-success bg-success/10";
  if (tone === "warning") return "text-warning bg-warning/10";
  return "text-text-muted";
}

export default async function DashboardPage() {
  const user = await verifySession();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-muted">
          Aquí tienes un resumen de la actividad de tu complejo hoy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft"
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
                <span
                  className={`flex items-center rounded-full px-2 py-1 text-sm font-medium ${tagClasses(
                    kpi.tag.tone
                  )}`}
                >
                  {kpi.tag.tone === "success" && (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  )}
                  {kpi.tag.text}
                </span>
              </div>
              <p className="text-sm font-medium text-text-muted">{kpi.label}</p>
              <h3 className="mt-1 text-3xl font-bold text-text-main">
                {kpi.value}
              </h3>
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
              <h2 className="text-lg font-semibold text-text-main">
                Reservas por Mes
              </h2>
              <p className="text-sm text-text-muted">
                Comparativa de los últimos 6 meses
              </p>
            </div>
            <button className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-4 flex h-48 flex-1 items-end justify-between gap-2 border-b border-gray-100 pb-2 pt-4">
            {/* Líneas de grid */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-full border-t border-dashed border-gray-200" />
              ))}
            </div>
            {/* Barras */}
            {CHART.map((bar) => (
              <div
                key={bar.month}
                className="group z-10 flex w-1/6 flex-col items-center"
              >
                <div
                  className={`relative w-full rounded-t-md ${bar.color} transition-[height] duration-500`}
                  style={{ height: `${bar.height}%` }}
                >
                  {bar.value && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-text-main px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {bar.value}
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-text-muted">
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas reservas */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main">
              Próximas Reservas
            </h2>
            <a
              href="#"
              className="text-sm font-medium text-secondary transition-colors hover:text-primary"
            >
              Ver todas
            </a>
          </div>

          <div className="flex-1 space-y-4">
            {UPCOMING.map((item, i) => (
              <div
                key={i}
                className="flex items-start rounded-xl border border-transparent bg-background p-3 transition-colors hover:border-gray-200"
              >
                <div className="mr-4 flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                  <span className={`text-xs font-semibold ${item.monthColor}`}>
                    {item.month}
                  </span>
                  <span className="text-lg font-bold leading-tight text-text-main">
                    {item.day}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-main">
                    {item.space}
                  </h4>
                  <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
                  <div className="mt-2 flex items-center">
                    <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                      {item.initials}
                    </div>
                    <span className="text-xs font-medium text-text-main">
                      {item.client}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de últimas reservas */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-text-main">
              Últimas Reservas Generadas
            </h2>
            <p className="text-sm text-text-muted">
              Actividad reciente en tu portal.
            </p>
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
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-background">
                {["Cliente", "Espacio", "Fecha / Hora", "Monto", "Estado"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                      {h}
                    </th>
                  )
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {RESERVATIONS.map((r, i) => (
                <tr key={i} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${r.avatarTone}`}
                      >
                        {r.initials}
                      </div>
                      <div>
                        <p className="font-medium text-text-main">{r.name}</p>
                        <p className="text-xs text-text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-main">
                    {r.space}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-text-main">{r.date}</p>
                    <p className="text-xs text-text-muted">{r.time}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-main">
                    {r.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`}
                      />
                      {r.status}
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
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 pb-8 text-center">
        <p className="text-xs text-text-muted">
          © 2026 RecreAdmin. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
