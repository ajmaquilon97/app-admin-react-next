"use client";

import { useReversals } from "../hooks/useFinanciero";
import { REVERSAL_STATUS_STYLES } from "../constants";
import type { FinancialFilters } from "../types";

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-2 w-20 bg-gray-50 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  filters: FinancialFilters;
  onChangeFilters: (f: FinancialFilters) => void;
}

export function ReversosTable({ filters, onChangeFilters }: Props) {
  const { data, isLoading, isError } = useReversals(filters);

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-[#EF4444] font-medium">Error al cargar los reversos.</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
        <p className="text-[#1F2937] font-semibold">No hay reversos en este rango</p>
        <p className="text-sm text-[#6B7280] mt-1">
          Las anulaciones de factura y reembolsos por cancelación de reserva aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              {["Fecha solicitud", "Reserva", "Cliente", "Monto", "Motivo", "Estado"].map((h, i) => (
                <th
                  key={h}
                  className={`py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50${
                    i === 3 ? " text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((reversal) => (
              <tr key={reversal.id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                <td className="py-4 px-6 text-sm text-[#6B7280]">{reversal.fechaSolicitud}</td>
                <td className="py-4 px-6 text-sm font-mono text-[#1F2937]">{reversal.bookingCode}</td>
                <td className="py-4 px-6 text-sm font-medium text-[#1F2937]">{reversal.clientName}</td>
                <td className="py-4 px-6 text-sm font-semibold text-[#1F2937] text-right">${reversal.monto.toFixed(2)}</td>
                <td className="py-4 px-6 text-sm text-[#6B7280] max-w-[240px] truncate" title={reversal.motivo}>
                  {reversal.motivo}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${REVERSAL_STATUS_STYLES[reversal.estado]}`}
                  >
                    {reversal.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm text-[#6B7280]">
          <span>{data.total} reversos en total</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => onChangeFilters({ ...filters, page: data.page - 1 })}
              className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            <span>
              Página {data.page} de {data.totalPages}
            </span>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => onChangeFilters({ ...filters, page: data.page + 1 })}
              className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
