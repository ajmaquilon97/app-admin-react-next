import { DashboardKPIs } from "./DashboardKPIs";
import { ReservasChart } from "./ReservasChart";
import { UpcomingBookings } from "./UpcomingBookings";
import { RecentBookingsTable } from "./RecentBookingsTable";
import type { DashboardData } from "../types";

/** Server Component: el dashboard no tiene interacción de cliente, así que no lleva hooks. */
export function DashboardModule({ firstName, data }: { firstName: string; data: DashboardData }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="page-title">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-text-muted">
          Aquí tienes un resumen de la actividad de tu complejo hoy.
        </p>
      </div>

      <DashboardKPIs kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReservasChart bars={data.chartBars} />
        <UpcomingBookings items={data.upcoming} />
      </div>

      <RecentBookingsTable rows={data.recent} />

      <div className="mt-8 border-t border-gray-200 pt-4 pb-8 text-center">
        <p className="text-xs text-text-muted">© 2026 RecreAdmin. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
