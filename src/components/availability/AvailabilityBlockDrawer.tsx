"use client";

import { X, Calendar, Clock, Lock, Unlock, Edit3 } from "lucide-react";
import type { Block } from "./types";
import { getStatusClasses, STATUS_LABELS } from "./statusStyles";

const MONTHS_ES = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function formatBlockDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${DAY_NAMES[date.getDay()]}, ${d} ${MONTHS_ES[m! - 1]} ${y}`;
}

export function AvailabilityBlockDrawer({
  block,
  isActing,
  onClose,
  onBlock,
  onRelease,
}: {
  block: Block;
  isActing: boolean;
  onClose: () => void;
  onBlock: (block: Block) => void;
  onRelease: (block: Block) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-text-main">Detalles del Horario</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-text-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Status badge */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${getStatusClasses(block.status)}`}
          >
            <div className="font-bold text-base">{STATUS_LABELS[block.status]}</div>
            <div
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                block.status === "reserved" ? "bg-white/20" : "bg-white shadow-sm text-text-main"
              }`}
            >
              {block.espacioNombre}
            </div>
          </div>

          {/* Date / Hour */}
          <div className="bg-background rounded-xl p-4 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-text-muted">
                <Calendar size={15} className="mr-2" /> Fecha
              </div>
              <span className="font-medium text-text-main text-sm">
                {formatBlockDate(block.date)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-text-muted">
                <Clock size={15} className="mr-2" /> Hora
              </div>
              <span className="font-medium text-text-main text-sm">
                {block.hour}:00 – {block.hour + 1}:00
              </span>
            </div>
          </div>

          {/* Client info (reserved) */}
          {block.clientName && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Información de Reserva
              </h4>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {block.clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-text-main text-sm">{block.clientName}</p>
                  <button className="text-xs text-primary hover:text-primary-hover font-medium mt-0.5 transition-colors">
                    Ver detalles de reserva →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {block.notes && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Observaciones
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm text-text-main">
                {block.notes}
              </div>
            </div>
          )}

          {/* Read-only notice for reserved */}
          {block.status === "reserved" && (
            <p className="text-xs text-text-muted bg-background rounded-lg p-3 border border-gray-100">
              Las reservas confirmadas solo pueden editarse o cancelarse desde el módulo{" "}
              <strong>Reservas</strong>.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          {block.status === "available" && (
            <button
              onClick={() => onBlock(block)}
              disabled={isActing}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-[#1F2937] text-white rounded-lg hover:bg-black transition-colors font-medium text-sm shadow-md disabled:opacity-60"
            >
              <Lock size={15} className="mr-2" />
              {isActing ? "Bloqueando..." : "Bloquear horario"}
            </button>
          )}

          {(block.status === "blocked" || block.status === "maintenance") && (
            <button
              onClick={() => onRelease(block)}
              disabled={isActing}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-60"
            >
              <Unlock size={15} className="mr-2 text-gray-400" />
              {isActing ? "Liberando..." : "Liberar horario"}
            </button>
          )}

          {block.status !== "reserved" && block.status !== "closed" && (
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                <Edit3 size={15} className="mr-2 text-gray-400" /> Editar
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center py-2.5 px-4 bg-white border border-transparent text-error hover:bg-error/5 rounded-lg transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
