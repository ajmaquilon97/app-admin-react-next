"use client";

import { Search, Calendar, List, CalendarDays } from "lucide-react";
import type { BookingFilters, SpaceOption } from "../types";

interface Props {
  filters: BookingFilters;
  onChange: (filters: BookingFilters) => void;
  spaces: SpaceOption[];
  viewMode: "list" | "calendar";
  onViewModeChange: (m: "list" | "calendar") => void;
}

export function BookingFiltersBar({ filters, onChange, spaces, viewMode, onViewModeChange }: Props) {
  const set = (patch: Partial<BookingFilters>) => onChange({ ...filters, ...patch, page: 1 });
  const clear = () => onChange({ page: 1 });

  return (
    <div className="bg-white p-3 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Búsqueda */}
        <div className="flex items-center px-3 py-2 bg-[#F5F7FA] rounded-lg border border-transparent focus-within:border-[#487AD0]/30 transition-colors">
          <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Filtrar..."
            value={filters.search ?? ""}
            onChange={(e) => set({ search: e.target.value || undefined })}
            className="bg-transparent border-none outline-none w-32 text-sm text-[#1F2937] placeholder-gray-400"
          />
        </div>

        {/* Espacio */}
        <select
          value={filters.spaceId ?? ""}
          onChange={(e) => set({ spaceId: e.target.value || undefined })}
          className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <option value="">Todos los espacios</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={filters.status ?? ""}
          onChange={(e) => set({ status: (e.target.value as BookingFilters["status"]) || undefined })}
          className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <option value="">Estado: Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Reagendada">Reagendada</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Finalizada">Finalizada</option>
        </select>

        {/* Fecha desde */}
        <div className="flex items-center px-3 py-2 bg-[#F5F7FA] rounded-lg border border-transparent focus-within:border-[#487AD0]/30 transition-colors">
          <Calendar size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => set({ dateFrom: e.target.value || undefined })}
            className="bg-transparent border-none outline-none text-sm text-[#1F2937]"
          />
        </div>

        <div className="h-6 w-px bg-gray-200 hidden lg:block" />

        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-gray-400 hover:text-[#EF4444] transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Vista lista / calendario */}
      <div className="flex bg-[#F5F7FA] rounded-lg p-1 shrink-0 ml-auto lg:ml-0">
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={`p-1.5 rounded-md transition-colors flex items-center ${
            viewMode === "list" ? "bg-white shadow-sm text-[#487AD0]" : "text-[#6B7280] hover:text-[#1F2937]"
          }`}
          title="Vista Lista"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("calendar")}
          className={`p-1.5 rounded-md transition-colors flex items-center ${
            viewMode === "calendar" ? "bg-white shadow-sm text-[#487AD0]" : "text-[#6B7280] hover:text-[#1F2937]"
          }`}
          title="Vista Calendario"
        >
          <CalendarDays size={16} />
        </button>
      </div>
    </div>
  );
}
