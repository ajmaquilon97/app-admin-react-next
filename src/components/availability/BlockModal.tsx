"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Espacio } from "./types";
import { formatISODate } from "@/lib/availability-mock";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export function BlockModal({
  spaces,
  prefilledDate,
  prefilledHour,
  prefilledEspacioId,
  onClose,
  onConfirm,
}: {
  spaces: Espacio[];
  prefilledDate?: string;
  prefilledHour?: number;
  prefilledEspacioId?: number;
  onClose: () => void;
  onConfirm: (data: {
    espacioId: number;
    fecha: string;
    hourStart: number;
    hourEnd: number;
    estado: "blocked" | "maintenance";
    notas?: string;
  }) => Promise<void>;
}) {
  const todayStr = formatISODate(new Date());
  const defaultSpace = prefilledEspacioId ?? spaces[0]?.id ?? 0;

  const [espacioId, setEspacioId] = useState<number>(defaultSpace);
  const [fecha, setFecha] = useState(prefilledDate ?? todayStr);
  const [hourStart, setHourStart] = useState(prefilledHour ?? 8);
  const [hourEnd, setHourEnd] = useState((prefilledHour ?? 8) + 1);
  const [estado, setEstado] = useState<"blocked" | "maintenance">("blocked");
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (hourEnd <= hourStart) {
      setError("La hora fin debe ser posterior a la hora inicio.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm({ espacioId, fecha, hourStart, hourEnd, estado, notas: notas || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el bloqueo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-text-main">Bloquear horario</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={18} />
            </button>
          </div>

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

            {/* Horas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Hora inicio</label>
                <select
                  value={hourStart}
                  onChange={(e) => setHourStart(Number(e.target.value))}
                  className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Hora fin</label>
                <select
                  value={hourEnd}
                  onChange={(e) => setHourEnd(Number(e.target.value))}
                  className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  {[...HOURS.filter((h) => h > hourStart), 19].map((h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de bloqueo */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Tipo</label>
              <div className="flex gap-2">
                {([
                  { value: "blocked", label: "Bloqueo" },
                  { value: "maintenance", label: "Mantenimiento" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setEstado(value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      estado === value
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-transparent text-text-muted hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">
                Motivo <span className="text-text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Ej. Mantenimiento programado, revisión técnica..."
                className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none placeholder-gray-400"
              />
            </div>

            {error && <p className="text-xs text-error">{error}</p>}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 px-4 bg-background text-text-main rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || spaces.length === 0}
              className="flex-1 py-2.5 px-4 bg-[#1F2937] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Bloqueando..." : "Confirmar bloqueo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
