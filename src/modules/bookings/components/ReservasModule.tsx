"use client";

import { useState } from "react";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";
import { useSpaces } from "../hooks/useBookings";
import { BookingKPIs } from "./BookingKPIs";
import { BookingFiltersBar } from "./BookingFiltersBar";
import { BookingsTable } from "./BookingsTable";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { BookingCalendarView } from "./BookingCalendarView";
import type { Booking, BookingFilters } from "../types";

export function ReservasModule() {
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
            <h1 className="page-title">Reservas</h1>
            <p className="text-text-muted mt-1 text-sm">
              Administra todas las reservas realizadas por tus clientes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HeaderSpaceSelector
              espacios={spaces}
              value={filters.spaceId ?? null}
              onChange={(id) => setFilters((prev) => ({ ...prev, spaceId: id ?? undefined, page: 1 }))}
              allowAll
            />
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
