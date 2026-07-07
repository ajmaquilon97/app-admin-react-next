"use client";

import { CheckCircle2, Calendar, Lock, BarChart3 } from "lucide-react";
import type { Statistics } from "./types";

function StatSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100/50 shadow-soft animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-5 w-5 bg-gray-100 rounded" />
      </div>
      <div className="h-8 w-20 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-28 bg-gray-100 rounded" />
    </div>
  );
}

export function AvailabilityStats({
  stats,
  isLoading,
}: {
  stats: Statistics | null;
  isLoading: boolean;
}) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Horas Disponibles",
      value: `${stats.horasDisponibles}h`,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Horas Reservadas",
      value: `${stats.horasReservadas}h`,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Horas Bloqueadas",
      value: `${stats.horasBloqueadas}h`,
      icon: Lock,
      color: "text-text-muted",
      bg: "bg-gray-100",
    },
    {
      label: "Ocupación",
      value: `${stats.ocupacion}%`,
      icon: BarChart3,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="bg-white p-5 rounded-xl border border-gray-100/50 shadow-soft"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-text-muted font-medium">{c.label}</p>
              <div className={`p-1.5 rounded-lg ${c.bg}`}>
                <Icon size={16} className={c.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-main">{c.value}</p>
          </div>
        );
      })}
    </div>
  );
}
