"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";
import { useSpaces } from "../hooks/useBookings";
import { BookingKPIs } from "./BookingKPIs";
import { BookingFiltersBar } from "./BookingFiltersBar";
import { BookingsTable } from "./BookingsTable";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { BookingCalendarView } from "./BookingCalendarView";
import type { Booking, BookingFilters } from "../types";

const queryClient = new QueryClient();

function ReservasModuleInner() {
  const [filters, setFilters] = useState<BookingFilters>({ page: 1 });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selected, setSelected] = useState<Booking | null>(null);
  const { data: spaces = [] } = useSpaces();

  const handleSelect = (b: Booking) => {
    setSelected((prev) => (prev?.id === b.id ? null : b));
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Reservas</h1>
            <p className="text-[#6B7280] mt-1 text-sm">
              Administra todas las reservas realizadas por tus clientes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HeaderSpaceSelector
              espacios={spaces}
              value={filters.spaceId ?? ""}
              onChange={(id) => setFilters((prev) => ({ ...prev, spaceId: id || undefined, page: 1 }))}
              allowAll
            />
            <button
              type="button"
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[#1F2937]"
            >
              <Download size={16} className="mr-2 text-gray-400" />
              Exportar
            </button>
            <button
              type="button"
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-[0_4px_12px_rgba(30,58,95,0.25)]"
            >
              <Plus size={16} className="mr-2" />
              Nueva reserva manual
            </button>
          </div>
        </div>

        {/* KPIs */}
        <BookingKPIs />

        {/* Filtros */}
        <BookingFiltersBar
          filters={filters}
          onChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Tabla / Calendario */}
        {viewMode === "list" ? (
          <BookingsTable
            filters={filters}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
          />
        ) : (
          <BookingCalendarView />
        )}
      </div>

      {/* Drawer lateral de detalle */}
      {selected && (
        <BookingDetailDrawer
          booking={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export function ReservasModule() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReservasModuleInner />
    </QueryClientProvider>
  );
}
