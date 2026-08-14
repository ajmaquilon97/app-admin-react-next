"use client";

import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { useInvoices, useRetryInvoice } from "../hooks/useFinanciero";
import { INVOICE_STATUS_STYLES } from "../constants";
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

const RETRYABLE = new Set(["Devuelta", "Error"]);

interface Props {
  filters: FinancialFilters;
  onChangeFilters: (f: FinancialFilters) => void;
}

export function FacturasTable({ filters, onChangeFilters }: Props) {
  const { data, isLoading, isError } = useInvoices(filters);
  const retry = useRetryInvoice();

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-[#EF4444] font-medium">Error al cargar las facturas.</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
        <p className="text-text-main font-semibold">No hay facturas en este rango</p>
        <p className="text-sm text-text-muted mt-1">Ajusta los filtros para ver más resultados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              {["No. comprobante", "Cliente", "Emisión", "Autorización", "Total", "Estado", "Acciones"].map((h, i) => (
                <th
                  key={h}
                  className={`py-4 px-6 border-b border-gray-100 text-text-muted font-semibold text-xs uppercase tracking-wider bg-gray-50/50${
                    i === 6 ? " text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-[#F5F7FA]/50 transition-colors group">
                <td className="py-4 px-6">
                  <p className="text-sm font-mono text-text-main">{invoice.numeroComprobante}</p>
                  <p className="text-xs text-text-muted mt-0.5 font-mono truncate max-w-[180px]" title={invoice.claveAcceso}>
                    {invoice.claveAcceso}
                  </p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm font-medium text-text-main">{invoice.clientName}</p>
                  <p className="text-xs text-text-muted mt-0.5">{invoice.clientIdentification}</p>
                  <p className="text-xs text-primary mt-0.5 font-mono">{invoice.bookingCode}</p>
                </td>
                <td className="py-4 px-6 text-sm text-text-muted">{invoice.fechaEmision}</td>
                <td className="py-4 px-6 text-sm text-text-muted">{invoice.fechaAutorizacion ?? "—"}</td>
                <td className="py-4 px-6 text-sm font-semibold text-text-main">${invoice.total.toFixed(2)}</td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${INVOICE_STATUS_STYLES[invoice.estado]}`}
                    title={invoice.motivoRechazo ?? undefined}
                  >
                    {invoice.motivoRechazo && <AlertCircle size={12} className="mr-1" />}
                    {invoice.estado}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {invoice.ridePdfUrl && (
                      <a
                        href={invoice.ridePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-primary hover:bg-[#1E3A5F]/10 rounded-md transition-colors"
                        title="Descargar RIDE (PDF)"
                      >
                        <Download size={16} />
                      </a>
                    )}
                    {RETRYABLE.has(invoice.estado) && (
                      <button
                        type="button"
                        onClick={() => retry.mutate(invoice.id)}
                        disabled={retry.isPending}
                        className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-md transition-colors disabled:opacity-40"
                        title="Reintentar emisión"
                      >
                        <RefreshCw size={16} className={retry.isPending ? "animate-spin" : ""} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm text-text-muted">
          <span>{data.total} facturas en total</span>
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
