"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckCircle2, XCircle, LifeBuoy } from "lucide-react";
import { useTicketsSoporte, useResolveTicket } from "../hooks/useTicketsSoporte";
import { ResolverTicketDialog } from "./ResolverTicketDialog";
import type { TicketEstado, TicketFilters, TicketSoporte } from "../types";

const ESTADO_OPTIONS: { value: TicketEstado | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "abierto", label: "Abierto" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

const ESTADO_STYLES: Record<TicketEstado, string> = {
  abierto: "bg-amber-50 text-amber-700 border-amber-200",
  en_revision: "bg-blue-50 text-blue-700 border-blue-200",
  aprobado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rechazado: "bg-red-50 text-red-700 border-red-200",
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
}

function TicketsSoporteModuleInner() {
  const [filters, setFilters] = useState<TicketFilters>({ page: 1 });
  const [resolving, setResolving] = useState<{ ticket: TicketSoporte; aprobado: boolean } | null>(null);

  const { data, isLoading, isError } = useTicketsSoporte(filters);
  const resolve = useResolveTicket();

  const tickets = data?.items ?? [];
  const puedeResolver = (t: TicketSoporte) => t.estado === "abierto" || t.estado === "en_revision";

  const handleConfirm = (notas: string) => {
    if (!resolving) return;
    resolve.mutate(
      { ticketId: resolving.ticket.id, aprobado: resolving.aprobado, notas },
      { onSuccess: () => setResolving(null) },
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Tickets de Soporte</h1>
          <p className="text-[#6B7280] mt-1 text-sm">
            Incidencias reportadas por clientes sobre reservas ya en curso o finalizadas.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <select
            value={filters.estado ?? ""}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value as TicketEstado | "", page: 1 })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          >
            {ESTADO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-[#6B7280]">
            Cargando tickets…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-[#EF4444] font-medium">Error al cargar los tickets de soporte.</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-[#1F2937] font-semibold">No hay tickets</p>
            <p className="text-sm text-[#6B7280] mt-1">No se encontraron incidencias con ese filtro.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    {["Reserva", "Cliente", "Descripción", "Estado", "Fecha", "Acciones"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50${i === 5 ? " text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-mono text-[#1F2937]">{t.reservaCodigo}</td>
                      <td className="py-4 px-6 text-sm text-[#1F2937]">{t.clienteNombre}</td>
                      <td className="py-4 px-6 text-sm text-[#6B7280] max-w-xs truncate" title={t.descripcion}>
                        {t.descripcion}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${ESTADO_STYLES[t.estado]}`}>
                          {t.estadoLabel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#6B7280]">{formatFecha(t.fechaCreacion)}</td>
                      <td className="py-4 px-6 text-right">
                        {puedeResolver(t) ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="p-1.5 text-[#27AE60] hover:bg-[#27AE60]/10 rounded-md transition-colors"
                              title="Aprobar"
                              onClick={() => setResolving({ ticket: t, aprobado: true })}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors"
                              title="Rechazar"
                              onClick={() => setResolving({ ticket: t, aprobado: false })}
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B7280]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm text-[#6B7280]">
                <span>{data.total} tickets en total</span>
                <span>Página {data.page} de {data.totalPages}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {resolving && (
        <ResolverTicketDialog
          ticket={resolving.ticket}
          aprobado={resolving.aprobado}
          onConfirm={handleConfirm}
          onClose={() => setResolving(null)}
          loading={resolve.isPending}
        />
      )}
    </div>
  );
}

export function TicketsSoporteModule() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TicketsSoporteModuleInner />
    </QueryClientProvider>
  );
}
