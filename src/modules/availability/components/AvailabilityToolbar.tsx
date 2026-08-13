"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewMode } from "../types";
import { getWeekDates } from "../utils/date";

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function weekLabel(weekStart: Date): string {
  const dates = getWeekDates(weekStart);
  const first = dates[0]!;
  const last = dates[6]!;
  const startDay = first.getDate();
  const endDay = last.getDate();
  const month = MONTHS_ES[last.getMonth()]!;
  const year = last.getFullYear();
  if (first.getMonth() === last.getMonth()) {
    return `${startDay} - ${endDay} ${month}, ${year}`;
  }
  return `${startDay} ${MONTHS_ES[first.getMonth()]} - ${endDay} ${month}, ${year}`;
}

export function AvailabilityToolbar({
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  weekStart,
  onPrev,
  onNext,
  onToday,
  simplified = false,
}: {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  /** Espacios de cupo compartido (piscinas) no tienen vista Día/Semana/Mes ni estado por hora. */
  simplified?: boolean;
}) {
  // Solo existe la vista semanal — Día/Mes se quitaron: antes cambiaban de
  // pestaña sin cambiar el calendario (AvailabilityCalendar solo renderiza semana).
  const VIEW_TABS: { label: string; value: ViewMode }[] = [
    { label: "Semana", value: "week" },
  ];

  return (
    <div className="bg-white p-2 rounded-xl shadow-soft border border-gray-100/50 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
      {/* Left: view tabs + status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {!simplified && (
          <>
            {/* View tabs */}
            <div className="flex bg-background rounded-lg p-1">
              {VIEW_TABS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === value
                      ? "bg-white shadow-sm text-text-main"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-200" />

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-transparent border-none text-text-muted py-2 px-3 text-sm font-medium focus:outline-none cursor-pointer hover:text-text-main"
            >
              <option value="all">Estado: Todos</option>
              <option value="available">Disponible</option>
              <option value="reserved">Reservado</option>
              <option value="blocked">Bloqueado</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="closed">Cerrado</option>
            </select>
          </>
        )}
      </div>

      {/* Right: week navigation */}
      <div className="flex items-center gap-3 pr-2">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-1 hover:bg-gray-100 rounded text-text-muted transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 text-xs font-medium rounded-md bg-background hover:bg-gray-100 text-text-main transition-colors"
          >
            Hoy
          </button>
          <span className="text-sm font-semibold text-text-main min-w-[150px] text-center">
            {weekLabel(weekStart)}
          </span>
          <button onClick={onNext} className="p-1 hover:bg-gray-100 rounded text-text-muted transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
