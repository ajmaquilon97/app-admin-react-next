"use client";

import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { ViewMode, Espacio } from "./types";
import { getWeekDates } from "@/lib/availability-mock";

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
  spaces,
  viewMode,
  setViewMode,
  selectedEspacioId,
  setSelectedEspacioId,
  statusFilter,
  setStatusFilter,
  weekStart,
  onPrev,
  onNext,
  onToday,
}: {
  spaces: Espacio[];
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selectedEspacioId: number;
  setSelectedEspacioId: (id: number) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const VIEW_TABS: { label: string; value: ViewMode }[] = [
    { label: "Día", value: "day" },
    { label: "Semana", value: "week" },
    { label: "Mes", value: "month" },
  ];

  return (
    <div className="bg-white p-2 rounded-xl shadow-soft border border-gray-100/50 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
      {/* Left: space selector + view tabs + status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Space selector */}
        <div className="relative">
          <select
            value={String(selectedEspacioId)}
            onChange={(e) => setSelectedEspacioId(Number(e.target.value))}
            className="appearance-none bg-background border border-transparent text-text-main py-2 pl-4 pr-9 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {spaces.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.nombre}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
            <Filter size={13} />
          </div>
        </div>

        <div className="h-5 w-px bg-gray-200" />

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
