"use client";

import { useState } from "react";
import { Users, Ticket, Loader2, AlertCircle } from "lucide-react";
import type { Espacio } from "../types";
import { useAforoSemana, useAforoDia } from "../hooks/useAforo";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function barColor(pct: number): string {
  if (pct >= 100) return "bg-error";
  if (pct >= 75) return "bg-warning";
  return "bg-success";
}

export function AforoPanel({ espacio, weekStart }: { espacio: Espacio; weekStart: Date }) {
  // Resumen de la semana (tira de 7 días) — GET /api/aforo
  const semanaQuery = useAforoSemana(espacio.id, weekStart);
  const dias = semanaQuery.data ?? [];
  const isLoadingSemana = semanaQuery.isPending;
  const errorSemana = semanaQuery.isError
    ? semanaQuery.error instanceof Error
      ? semanaQuery.error.message
      : "No se pudo cargar el aforo."
    : null;

  // El día elegido por el usuario solo vale mientras siga dentro de la semana
  // visible; si no, se cae al primero. Derivarlo en render (en vez de fijarlo
  // desde un efecto) evita quedar apuntando a una fecha de la semana anterior.
  const [pickedFecha, setPickedFecha] = useState<string | null>(null);
  const selectedFecha =
    pickedFecha && dias.some((d) => d.fecha === pickedFecha)
      ? pickedFecha
      : (dias[0]?.fecha ?? null);
  const setSelectedFecha = setPickedFecha;

  // Detalle del día seleccionado (tickets) — GET /api/aforo/dia, carga perezosa
  const detalleQuery = useAforoDia(espacio.id, selectedFecha);
  const detalle = detalleQuery.data ?? null;
  const isLoadingDetalle = detalleQuery.isPending && selectedFecha != null;
  const errorDetalle = detalleQuery.isError
    ? detalleQuery.error instanceof Error
      ? detalleQuery.error.message
      : "No se pudo cargar el detalle del día."
    : null;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title">Aforo por día</h3>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users size={14} /> Aforo máximo: {espacio.maxCapacidad} personas
        </div>
      </div>

      {errorSemana && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorSemana}</span>
        </div>
      )}

      {isLoadingSemana ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3 mb-6">
          {dias.map((d, i) => {
            const pct = d.capacidadTotal > 0 ? Math.round((d.vendida / d.capacidadTotal) * 100) : 0;
            const isSelected = d.fecha === selectedFecha;
            return (
              <button
                key={d.fecha}
                type="button"
                onClick={() => setSelectedFecha(d.fecha)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <p className="text-xs font-semibold text-text-main">{DIAS_CORTOS[i]}</p>
                <p className="text-[11px] text-text-muted mb-2">{d.fecha.slice(8, 10)}</p>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5">
                  {d.vendida}/{d.capacidadTotal}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedFecha && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-main">Entradas del {selectedFecha}</h4>
            {detalle && (
              <span className="text-xs text-text-muted">
                {detalle.disponible} disponibles de {detalle.capacidadTotal}
              </span>
            )}
          </div>

          {errorDetalle && (
            <p className="text-sm text-error">{errorDetalle}</p>
          )}

          {isLoadingDetalle ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : detalle && detalle.tickets.length === 0 ? (
            <p className="text-sm text-text-muted">Sin ventas registradas este día.</p>
          ) : (
            detalle && (
              <div className="space-y-2">
                {detalle.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Ticket size={14} className="text-text-muted" />
                      <span className="font-medium text-text-main">{t.clienteNombre}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted text-xs">
                      <span>{t.cantidad} {t.cantidad === 1 ? "entrada" : "entradas"}</span>
                      <span>{t.hora}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
