import { Filter, Download, MoreVertical } from "lucide-react";
import type { TableRow } from "../types";

const COLUMNS = ["Cliente", "Espacio", "Fecha / Hora", "Monto", "Estado"];

export function RecentBookingsTable({ rows }: { rows: TableRow[] }) {
  return (
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
        {rows.length > 0 ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-background">
                {COLUMNS.map((h) => (
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
              {rows.map((r, i) => (
                <tr key={i} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${r.avatarTone}`}>
                        {r.initials}
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
  );
}
