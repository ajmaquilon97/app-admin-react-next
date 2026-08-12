import { MoreHorizontal } from "lucide-react";
import type { ChartBar } from "../types";

export function ReservasChart({ bars }: { bars: ChartBar[] }) {
  return (
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

      {bars.length > 0 ? (
        <div className="relative mt-4 flex h-48 flex-1 items-end justify-between gap-2 border-b border-gray-100 pb-2 pt-4">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-gray-200" />
            ))}
          </div>
          {bars.map((bar) => (
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
  );
}
