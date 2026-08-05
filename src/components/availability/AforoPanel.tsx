"use client";

import { useMemo, useState } from "react";
import { Users, Ticket } from "lucide-react";
import type { Espacio } from "./types";
import { getAforoSemana } from "@/lib/aforo-mock";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function barColor(pct: number): string {
  if (pct >= 100) return "bg-error";
  if (pct >= 75) return "bg-warning";
  return "bg-success";
}

export function AforoPanel({ espacio, weekStart }: { espacio: Espacio; weekStart: Date }) {
  const dias = useMemo(
    () => getAforoSemana(espacio.id, espacio.maxCapacidad, weekStart),
    [espacio.id, espacio.maxCapacidad, weekStart],
  );
  const [selectedFecha, setSelectedFecha] = useState<string>(dias[0]?.fecha ?? "");
  const selected = dias.find((d) => d.fecha === selectedFecha) ?? dias[0] ?? null;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-main">Aforo por día</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Vista simulada — se conectará al endpoint real de venta de entradas por día cuando el backend lo implemente.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users size={14} /> Aforo máximo: {espacio.maxCapacidad} personas
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-6">
        {dias.map((d, i) => {
          const pct = d.capacidadTotal > 0 ? Math.round((d.vendida / d.capacidadTotal) * 100) : 0;
          const isSelected = d.fecha === selected?.fecha;
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

      {selected && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-main">Entradas del {selected.fecha}</h4>
            <span className="text-xs text-text-muted">
              {selected.disponible} disponibles de {selected.capacidadTotal}
            </span>
          </div>
          {selected.tickets.length === 0 ? (
            <p className="text-sm text-text-muted">Sin ventas registradas este día.</p>
          ) : (
            <div className="space-y-2">
              {selected.tickets.map((t) => (
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
          )}
        </div>
      )}
    </div>
  );
}
