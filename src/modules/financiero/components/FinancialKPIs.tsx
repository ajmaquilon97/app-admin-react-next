"use client";

import { DollarSign, FileCheck2, AlertTriangle, RotateCcw } from "lucide-react";
import { useFinancialSummary } from "../hooks/useFinanciero";

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 animate-pulse"
        >
          <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
          <div className="h-7 w-16 bg-gray-100 rounded mb-2" />
          <div className="h-2 w-20 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FinancialKPIs() {
  const { data: summary, isLoading } = useFinancialSummary();

  if (isLoading || !summary) return <KPISkeleton />;

  const kpis = [
    {
      label: "Ingresos del mes",
      value: `$${summary.ingresosMes.toFixed(2)}`,
      sub:
        summary.variacionIngresos != null
          ? `${summary.variacionIngresos > 0 ? "+" : ""}${summary.variacionIngresos}% vs mes anterior`
          : "Sin datos comparativos",
      icon: DollarSign,
      color: "text-[#27AE60]",
    },
    {
      label: "Facturas autorizadas",
      value: String(summary.facturasAutorizadas),
      sub: "Emitidas ante el SRI",
      icon: FileCheck2,
      color: "text-primary",
    },
    {
      label: "Facturas con error",
      value: String(summary.facturasConError),
      sub: summary.facturasConError > 0 ? "Requieren revisión" : "Todo en orden",
      icon: AlertTriangle,
      color: summary.facturasConError > 0 ? "text-[#EF4444]" : "text-text-muted",
    },
    {
      label: "Total reversado",
      value: `$${summary.totalReversado.toFixed(2)}`,
      sub: "Notas de crédito + reembolsos",
      icon: RotateCcw,
      color: "text-[#14B8A6]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 flex items-start justify-between"
        >
          <div>
            <p className="text-sm text-text-muted font-medium mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-text-main">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
          <div className={`p-2 bg-gray-50 rounded-lg ${kpi.color}`}>
            <kpi.icon size={20} />
          </div>
        </div>
      ))}
    </div>
  );
}
