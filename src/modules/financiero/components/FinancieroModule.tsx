"use client";

import { useState } from "react";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";
import { FinancialKPIs } from "./FinancialKPIs";
import { FinancialChart } from "./FinancialChart";
import { FinancialFiltersBar } from "./FinancialFiltersBar";
import { IngresosTable } from "./IngresosTable";
import { FacturasTable } from "./FacturasTable";
import { ReversosTable } from "./ReversosTable";
import { useFinancieroSpaces } from "../hooks/useFinanciero";
import type { FinancialFilters } from "../types";

type Tab = "resumen" | "ingresos" | "facturas" | "reversos";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "ingresos", label: "Ingresos" },
  { id: "facturas", label: "Facturas" },
  { id: "reversos", label: "Reversos" },
];

const INVOICE_STATUS_OPTIONS = [
  { value: "Autorizada", label: "Autorizada" },
  { value: "Procesando", label: "Procesando" },
  { value: "Recibida", label: "Recibida" },
  { value: "Devuelta", label: "Devuelta" },
  { value: "No autorizada", label: "No autorizada" },
  { value: "Error", label: "Error" },
];

const REVERSAL_STATUS_OPTIONS = [
  { value: "Procesando", label: "Procesando" },
  { value: "Enviada", label: "Enviada" },
  { value: "Autorizada", label: "Autorizada" },
  { value: "Rechazada", label: "Rechazada" },
  { value: "Anulada", label: "Anulada" },
];

export function FinancieroModule() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [filters, setFilters] = useState<FinancialFilters>({ page: 1 });
  const { data: spaces = [] } = useFinancieroSpaces();

  const handleTabChange = (next: Tab) => {
    setTab(next);
    // Los filtros de una pestaña no aplican a las demás (ej. "status" significa algo distinto en
    // cada una) — pero el espacio seleccionado es un filtro de página, no de pestaña, así que se conserva.
    setFilters((prev) => ({ page: 1, spaceId: prev.spaceId }));
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="page-title">Financiero</h1>
            <p className="text-text-muted mt-1 text-sm">
              Ingresos, facturas electrónicas y reversos de tu negocio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HeaderSpaceSelector
              espacios={spaces}
              value={filters.spaceId ?? null}
              onChange={(id) => setFilters((prev) => ({ ...prev, spaceId: id ?? undefined, page: 1 }))}
              allowAll
            />
            {/* Exportar — comentado: sin funcionalidad definida. */}
            {/* <button
              type="button"
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-text-main"
            >
              <Download size={16} className="mr-2 text-gray-400" />
              Exportar
            </button> */}
          </div>
        </div>

        {/* KPIs (siempre visibles, dan contexto en cualquier pestaña) */}
        <FinancialKPIs />

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-[#1E3A5F] text-primary"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && <FinancialChart />}

        {tab === "ingresos" && (
          <>
            <FinancialFiltersBar filters={filters} onChange={setFilters} searchPlaceholder="Buscar cliente o reserva..." />
            <IngresosTable filters={filters} onChangeFilters={setFilters} />
          </>
        )}

        {tab === "facturas" && (
          <>
            <FinancialFiltersBar
              filters={filters}
              onChange={setFilters}
              statusOptions={INVOICE_STATUS_OPTIONS}
              statusLabel="Estado"
              searchPlaceholder="Buscar cliente, No. o clave de acceso..."
            />
            <FacturasTable filters={filters} onChangeFilters={setFilters} />
          </>
        )}

        {tab === "reversos" && (
          <>
            <FinancialFiltersBar
              filters={filters}
              onChange={setFilters}
              statusOptions={REVERSAL_STATUS_OPTIONS}
              statusLabel="Estado"
              showSearch={false}
            />
            <ReversosTable filters={filters} onChangeFilters={setFilters} />
          </>
        )}
      </div>
    </div>
  );
}

