"use client";

import type { EspacioPricing, TarifaDia } from "@/lib/pricing/types";

const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface Props {
  pricing: EspacioPricing;
  onChange: (pricing: EspacioPricing) => void;
}

export function DailyRatesTable({ pricing, onChange }: Props) {
  const updateDia = (index: number, field: keyof TarifaDia, value: boolean | number | null) => {
    const next = pricing.tarifasPorDia.map((d, i) =>
      i === index ? { ...d, [field]: value } : d,
    );
    onChange({ ...pricing, tarifasPorDia: next });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <h2 className="mb-4 card-title">Tarifa por Día</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left font-medium text-text-muted">Día</th>
              <th className="pb-3 text-center font-medium text-text-muted">Activo</th>
              <th className="pb-3 text-right font-medium text-text-muted">Precio especial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pricing.tarifasPorDia.map((dia, i) => (
              <tr key={dia.dia} className="py-2">
                <td className="py-3 font-medium text-text-main">{DIA_LABELS[dia.dia]}</td>
                <td className="py-3 text-center">
                  <button
                    type="button"
                    onClick={() => updateDia(i, "activo", !dia.activo)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      dia.activo ? "bg-[#1E3A5F]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        dia.activo ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3">
                  {dia.activo ? (
                    <div className="relative ml-auto w-36">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Precio base"
                        value={dia.precio ?? ""}
                        onChange={(e) =>
                          updateDia(i, "precio", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))
                        }
                        className="block w-full rounded-lg border border-gray-200 py-1.5 pl-7 pr-2 text-right text-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                      />
                    </div>
                  ) : (
                    <span className="block text-right text-text-muted text-xs">No disponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
