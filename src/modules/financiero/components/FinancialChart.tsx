"use client";

import { useState } from "react";
import { useFinancialSummary } from "../hooks/useFinanciero";

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-8 animate-pulse">
      <div className="h-4 w-40 bg-gray-100 rounded mb-6" />
      <div className="h-48 bg-gray-50 rounded" />
    </div>
  );
}

export function FinancialChart() {
  const { data: summary, isLoading } = useFinancialSummary();
  const [hovered, setHovered] = useState<number | null>(null);

  if (isLoading || !summary) return <ChartSkeleton />;

  const serie = summary.serieIngresos;
  const max = Math.max(1, ...serie.map((p) => p.monto));

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-text-main">Ingresos — últimos 14 días</h3>
        {hovered != null && (
          <span className="text-xs text-text-muted">
            {serie[hovered]!.fecha}: <span className="font-semibold text-text-main">${serie[hovered]!.monto.toFixed(2)}</span>
          </span>
        )}
      </div>
      <div className="relative h-48 flex items-end gap-2 border-b border-gray-100">
        {/* líneas de grilla punteadas */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-t border-dashed border-gray-100 w-full" />
          ))}
        </div>
        {serie.map((point, i) => (
          <div
            key={point.fecha}
            className="relative flex-1 flex flex-col items-center justify-end h-full group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={`w-full rounded-t-md transition-colors ${
                hovered === i ? "bg-[#1E3A5F]" : "bg-[#1E3A5F]/40 group-hover:bg-[#1E3A5F]/70"
              }`}
              style={{ height: `${Math.max(2, (point.monto / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {serie.map((point) => (
          <div key={point.fecha} className="flex-1 text-center text-[10px] text-gray-400">
            {point.fecha.slice(8, 10)}/{point.fecha.slice(5, 7)}
          </div>
        ))}
      </div>
    </div>
  );
}
