"use client";

import { useState } from "react";
import { X, CalendarCheck } from "lucide-react";
import type { Espacio } from "./types";
import { formatISODate } from "@/lib/availability-mock";

interface CreateAvailabilityData {
  espacioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion?: string;
}

interface Props {
  spaces: Espacio[];
  prefilledEspacioId?: number;
  prefilledDate?: string;
  onClose: () => void;
  onConfirm: (data: CreateAvailabilityData) => Promise<void>;
}

export function CreateAvailabilityModal({
  spaces,
  prefilledEspacioId,
  prefilledDate,
  onClose,
  onConfirm,
}: Props) {
  const todayStr = formatISODate(new Date());
  const defaultSpace = prefilledEspacioId ?? spaces[0]?.id ?? 0;

  const [espacioId, setEspacioId] = useState<number>(defaultSpace);
  const [fecha, setFecha] = useState(prefilledDate ?? todayStr);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!fecha) { setError("Selecciona una fecha."); return; }
    if (!horaInicio || !horaFin) { setError("Completa el rango de horario."); return; }
    if (horaFin <= horaInicio) { setError("La hora fin debe ser posterior a la hora inicio."); return; }
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm({
        espacioId,
        fecha,
        horaInicio,
        horaFin,
        descripcion: descripcion.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la disponibilidad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarCheck size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main">Crear disponibilidad</h3>
                <p className="text-xs text-text-muted mt-0.5">Define un horario disponible para una fecha específica</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Espacio */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Espacio</label>
              <select
                value={espacioId}
                onChange={(e) => setEspacioId(Number(e.target.value))}
                className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Rango horario */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Hora inicio</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Hora fin</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                Descripción <span className="text-text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Ej. Horario extendido por evento especial, apertura excepcional..."
                className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none placeholder-gray-400"
              />
            </div>

            {/* Resumen */}
            {horaInicio && horaFin && horaFin > horaInicio && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-primary">
                <CalendarCheck size={16} className="flex-shrink-0" />
                <span>
                  Disponible el <strong>{new Date(fecha + "T00:00:00").toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}</strong> de <strong>{horaInicio}</strong> a <strong>{horaFin}</strong>
                </span>
              </div>
            )}

            {error && <p className="text-xs text-error">{error}</p>}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-background text-text-main rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || spaces.length === 0}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Creando..." : "Crear disponibilidad"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
