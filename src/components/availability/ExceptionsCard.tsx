"use client";

import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AvailabilityException } from "./types";
import { EXCEPTION_TYPE_COLOR } from "./statusStyles";

const MONTHS_ES = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

function formatExceptionDate(dateStr: string, horaInicio?: string, horaFin?: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  const base = `${d} ${MONTHS_ES[m! - 1]} ${y}`;
  if (horaInicio && horaFin) return `${base} • ${horaInicio} - ${horaFin}`;
  if (horaInicio) return `${base} • desde ${horaInicio}`;
  return `${base} • Todo el día`;
}

export function ExceptionsCard({
  exceptions,
  onAdd,
  onEdit,
  onDelete,
}: {
  exceptions: AvailabilityException[];
  onAdd: () => void;
  onEdit: (exc: AvailabilityException) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text-main">Excepciones</h3>
          <p className="text-sm text-text-muted mt-0.5">Feriados, mantenimientos o cierres.</p>
        </div>
        <button
          onClick={onAdd}
          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center text-sm font-medium"
        >
          <Plus size={16} className="mr-1" /> Agregar
        </button>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No hay excepciones configuradas.</p>
      ) : (
        <div className="space-y-3">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="relative flex justify-between items-center p-3.5 bg-background rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-1.5 h-8 rounded-full ${EXCEPTION_TYPE_COLOR[exc.tipo] ?? "bg-gray-400"}`}
                />
                <div>
                  <p className="font-semibold text-text-main text-sm">{exc.titulo}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatExceptionDate(exc.fecha, exc.horaInicio, exc.horaFin)}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpenId(menuOpenId === exc.id ? null : exc.id)}
                  className="p-1 text-gray-400 hover:text-text-main transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>

                {menuOpenId === exc.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute right-0 top-7 z-20 w-36 bg-white rounded-xl shadow-card border border-gray-100 py-1 text-sm">
                      <button
                        onClick={() => { onEdit(exc); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-background text-text-main transition-colors"
                      >
                        <Pencil size={14} className="text-gray-400" /> Editar
                      </button>
                      <button
                        onClick={() => { onDelete(exc.id); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-error/5 text-error transition-colors"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
