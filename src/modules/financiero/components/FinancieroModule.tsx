"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Download } from "lucide-react";
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

function FinancieroModuleInner() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [filters, setFilters] = useState<FinancialFilters>({ page: 1 });
  const { data: spaces = [] } = useFinancieroSpaces();

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setFilters({ page: 1 }); // los filtros de una pestaña no aplican a las demás (ej. "status" significa algo distinto en cada una)
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Financiero</h1>
            <p className="text-[#6B7280] mt-1 text-sm">
              Ingresos, facturas electrónicas y reversos de tu negocio.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[#1F2937]"
          >
            <Download size={16} className="mr-2 text-gray-400" />
            Exportar
          </button>
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
                  ? "border-[#487AD0] text-[#487AD0]"
                  : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && <FinancialChart />}

        {tab === "ingresos" && (
          <>
            <FinancialFiltersBar filters={filters} onChange={setFilters} spaces={spaces} searchPlaceholder="Buscar cliente o reserva..." />
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
              searchPlaceholder="Buscar cliente o reserva..."
            />
            <ReversosTable filters={filters} onChangeFilters={setFilters} />
          </>
        )}
      </div>
    </div>
  );
}

export function FinancieroModule() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <FinancieroModuleInner />
    </QueryClientProvider>
  );
}
