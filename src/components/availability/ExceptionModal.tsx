"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { AvailabilityException } from "./types";
import { formatISODate } from "@/lib/availability-mock";

type ExceptionForm = Omit<AvailabilityException, "id">;

export function ExceptionModal({
  exception,
  onClose,
  onConfirm,
}: {
  exception?: AvailabilityException;
  onClose: () => void;
  onConfirm: (data: ExceptionForm) => Promise<void>;
}) {
  const todayStr = formatISODate(new Date());
  const [titulo, setTitulo] = useState(exception?.titulo ?? "");
  const [tipo, setTipo] = useState<AvailabilityException["tipo"]>(exception?.tipo ?? "feriado");
  const [fecha, setFecha] = useState(exception?.fecha ?? todayStr);
  const [horaInicio, setHoraInicio] = useState(exception?.horaInicio ?? "");
  const [horaFin, setHoraFin] = useState(exception?.horaFin ?? "");
  const [isAllDay, setIsAllDay] = useState(!exception?.horaInicio);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        titulo: titulo.trim(),
        tipo,
        fecha,
        horaInicio: isAllDay ? undefined : horaInicio || undefined,
        horaFin: isAllDay ? undefined : horaFin || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!exception;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-text-main">
              {isEdit ? "Editar excepción" : "Agregar excepción"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Titulo */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Feriado Nacional (Navidad)"
                className="w-full bg-background border border-transparent rounded-lg py-2 px-3 text-text-main text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-gray-400"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Tipo</label>
              <div className="flex gap-2">
                {(["feriado", "mantenimiento", "cierre"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      tipo === t
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-transparent text-text-muted hover:bg-gray-100"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
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

            {/* All day toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsAllDay(!isAllDay)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isAllDay ? "bg-primary" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAllDay ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm text-text-main">Todo el día</span>
            </label>

            {!isAllDay && (
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
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-background text-text-main rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !titulo.trim()}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar excepción"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
