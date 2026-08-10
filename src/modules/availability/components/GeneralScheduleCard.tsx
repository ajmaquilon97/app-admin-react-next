"use client";

import { Clock } from "lucide-react";
import { useState } from "react";
import type { Schedule } from "../types";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function GeneralScheduleCard({
  schedule,
  isLoading,
  onSave,
}: {
  schedule: Schedule;
  isLoading?: boolean;
  onSave: (s: Schedule) => Promise<void>;
}) {
  const [apertura, setApertura] = useState(schedule.apertura);
  const [cierre, setCierre] = useState(schedule.cierre);
  const [diasActivos, setDiasActivos] = useState(schedule.diasActivos);
  const [applyMode, setApplyMode] = useState<"all" | "byDay">("all");
  const [isSaving, setIsSaving] = useState(false);

  // Resincroniza el formulario cuando cambia el horario recibido (tras guardar
  // o al cambiar de espacio). Se ajusta durante el render en vez de con un
  // efecto: React re-renderiza de inmediato sin pintar el valor viejo primero.
  // Ver "Adjusting some state when a prop changes" en react.dev.
  const [syncedSchedule, setSyncedSchedule] = useState(schedule);
  if (schedule !== syncedSchedule) {
    setSyncedSchedule(schedule);
    setApertura(schedule.apertura);
    setCierre(schedule.cierre);
    setDiasActivos(schedule.diasActivos);
  }

  const toggleDay = (idx: number) => {
    setDiasActivos((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ apertura, cierre, diasActivos });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-56 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-9 bg-gray-100 rounded-lg" />
          <div className="h-9 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="modal-title">Horario General</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Configura la apertura y cierre por defecto.
          </p>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Clock size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-text-main mb-1.5">Apertura</label>
          <input
            type="time"
            value={apertura}
            onChange={(e) => setApertura(e.target.value)}
            className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-main mb-1.5">Cierre</label>
          <input
            type="time"
            value={cierre}
            onChange={(e) => setCierre(e.target.value)}
            className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="apply"
            checked={applyMode === "all"}
            onChange={() => setApplyMode("all")}
            className="text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-main">Todos los días</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="apply"
            checked={applyMode === "byDay"}
            onChange={() => setApplyMode("byDay")}
            className="text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-main">Por día</span>
        </label>
      </div>

      {applyMode === "byDay" && (
        <div className="flex gap-2 mb-4">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors ${
                diasActivos.includes(idx)
                  ? "bg-primary text-white"
                  : "bg-background text-text-muted hover:bg-gray-100"
              }`}
            >
              {label[0]}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
