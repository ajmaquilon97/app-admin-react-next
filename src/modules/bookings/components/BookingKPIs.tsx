"use client";

import { CalendarCheck, Clock, DollarSign, BarChart3 } from "lucide-react";
import { useBookingStatistics } from "../hooks/useBookings";

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 animate-pulse">
          <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
          <div className="h-7 w-16 bg-gray-100 rounded mb-2" />
          <div className="h-2 w-20 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function BookingKPIs() {
  const { data: stats, isLoading } = useBookingStatistics();

  if (isLoading || !stats) return <KPISkeleton />;

  const kpis = [
    {
      label: "Reservas de hoy",
      value: String(stats.reservasHoy),
      sub: "3 pendientes de pago",
      icon: CalendarCheck,
      color: "text-[#487AD0]",
    },
    {
      label: "Reservas pendientes",
      value: String(stats.pendientes),
      sub: "Requieren confirmación",
      icon: Clock,
      color: "text-[#F59E0B]",
    },
    {
      label: "Ingresos del día",
      value: `$${stats.ingresosDia.toFixed(0)}`,
      sub: `${stats.variacionIngresos > 0 ? "+" : ""}${stats.variacionIngresos}% vs ayer`,
      icon: DollarSign,
      color: "text-[#27AE60]",
    },
    {
      label: "Ocupación actual",
      value: `${stats.ocupacion}%`,
      sub: stats.ocupacion >= 70 ? "Alta demanda" : "Demanda moderada",
      icon: BarChart3,
      color: "text-[#8F0E55]",
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
            <p className="text-sm text-[#6B7280] font-medium mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#1F2937]">{kpi.value}</p>
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
