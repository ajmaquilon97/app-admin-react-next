"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import type { TicketSoporte } from "../types";

interface Props {
  ticket: TicketSoporte;
  aprobado: boolean;
  onConfirm: (notas: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export function ResolverTicketDialog({ ticket, aprobado, onConfirm, onClose, loading }: Props) {
  const [notas, setNotas] = useState("");
  const error = notas.trim().length > 0 && notas.trim().length < 5 ? "Mínimo 5 caracteres." : null;
  const canSubmit = notas.trim().length >= 5;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${aprobado ? "bg-[#27AE60]/10" : "bg-[#EF4444]/10"}`}>
              {aprobado ? (
                <CheckCircle2 size={18} className="text-[#27AE60]" />
              ) : (
                <XCircle size={18} className="text-[#EF4444]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[#1F2937]">{aprobado ? "Aprobar ticket" : "Rechazar ticket"}</h3>
              <p className="text-xs text-[#6B7280] font-mono">{ticket.reservaCodigo}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={16} />
          </button>
        </div>

        {aprobado && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Al aprobar, se dispara automáticamente el reverso (nota de crédito) de la reserva.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onConfirm(notas.trim());
          }}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Notas de resolución <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Explica la decisión..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#1E3A5F]/40 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/10 resize-none"
            />
            {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                aprobado ? "bg-[#27AE60] hover:bg-emerald-600" : "bg-[#EF4444] hover:bg-red-600"
              }`}
            >
              {loading ? "Procesando..." : aprobado ? "Confirmar aprobación" : "Confirmar rechazo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
