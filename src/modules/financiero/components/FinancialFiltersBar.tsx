"use client";

import { Search, Calendar } from "lucide-react";
import type { FinancialFilters } from "../types";

interface Props {
  filters: FinancialFilters;
  onChange: (filters: FinancialFilters) => void;
  statusOptions?: { value: string; label: string }[];
  statusLabel?: string;
  searchPlaceholder?: string;
}

export function FinancialFiltersBar({
  filters,
  onChange,
  statusOptions,
  statusLabel = "Estado",
  searchPlaceholder = "Buscar cliente o código...",
}: Props) {
  const set = (patch: Partial<FinancialFilters>) => onChange({ ...filters, ...patch, page: 1 });
  // El espacio es un filtro de página (seleccionado en el header), no de esta barra — se conserva al limpiar.
  const clear = () => onChange({ page: 1, spaceId: filters.spaceId });

  return (
    <div className="bg-white p-3 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center px-3 py-2 bg-[#F5F7FA] rounded-lg border border-transparent focus-within:border-[#487AD0]/30 transition-colors">
        <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value || undefined })}
          className="bg-transparent border-none outline-none w-44 text-sm text-[#1F2937] placeholder-gray-400"
        />
      </div>

      {statusOptions && (
        <select
          value={filters.status ?? ""}
          onChange={(e) => set({ status: e.target.value || undefined })}
          className="appearance-none bg-[#F5F7FA] border border-transparent text-[#1F2937] py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <option value="">{statusLabel}: Todos</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center px-3 py-2 bg-[#F5F7FA] rounded-lg border border-transparent focus-within:border-[#487AD0]/30 transition-colors">
        <Calendar size={14} className="text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => set({ dateFrom: e.target.value || undefined })}
          className="bg-transparent border-none outline-none text-sm text-[#1F2937]"
        />
        <span className="mx-1.5 text-gray-300">–</span>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => set({ dateTo: e.target.value || undefined })}
          className="bg-transparent border-none outline-none text-sm text-[#1F2937]"
        />
      </div>

      <div className="h-6 w-px bg-gray-200 hidden lg:block" />

      <button type="button" onClick={clear} className="text-sm font-medium text-gray-400 hover:text-[#EF4444] transition-colors">
        Limpiar
      </button>
    </div>
  );
}
