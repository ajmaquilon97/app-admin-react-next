"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { fechaEspecialSchema, type FechaEspecialForm } from "@/lib/pricing/schemas";
import type { FechaEspecial } from "@/lib/pricing/types";
import type { EspacioArchetype } from "@/lib/espacio-archetype";

interface Props {
  fechas: FechaEspecial[];
  onAdd: (fe: Omit<FechaEspecial, "id">) => Promise<unknown>;
  onDelete: (id: string) => void;
  loading?: boolean;
  archetype: EspacioArchetype;
}

const MODALIDAD_LABELS = { hora: "Por Hora", jornada: "Por Jornada", evento: "Por Evento", entrada: "Por Entrada" };

export function SpecialRatesCard({ fechas, onAdd, onDelete, loading, archetype }: Props) {
  const esCupoCompartido = archetype === "cupo_compartido";
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FechaEspecialForm>({
    resolver: zodResolver(fechaEspecialSchema),
    defaultValues: { modalidad: esCupoCompartido ? "entrada" : "hora" },
  });

  const submit = async (data: FechaEspecialForm) => {
    setFormError(null);
    try {
      await onAdd(data);
      reset();
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo agregar la fecha especial.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title">Fechas Especiales</h2>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setFormError(null); }}
          className="flex items-center gap-1 rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3a6abf]"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit(submit)}
          className="mb-4 rounded-xl border border-[#1E3A5F]/20 bg-[#1E3A5F]/5 p-4 space-y-3"
        >
          {formError && (
            <p className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
              {formError}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Fecha</label>
              <input
                type="date"
                {...register("fecha")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
              {errors.fecha && <p className="mt-1 text-xs text-red-500">{errors.fecha.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Modalidad</label>
              <select
                {...register("modalidad")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              >
                {esCupoCompartido ? (
                  <option value="entrada">Por Entrada</option>
                ) : (
                  <>
                    <option value="hora">Por Hora</option>
                    <option value="jornada">Por Jornada</option>
                    <option value="evento">Por Evento</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Precio ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                {...register("precio", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
              {errors.precio && <p className="mt-1 text-xs text-red-500">{errors.precio.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Descripción</label>
              <input
                type="text"
                placeholder="Ej: Feriado nacional"
                {...register("descripcion")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
              {errors.descripcion && (
                <p className="mt-1 text-xs text-red-500">{errors.descripcion.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); setFormError(null); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-text-muted hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3a6abf] disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {fechas.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-4">
          No hay fechas especiales configuradas.
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {fechas.map((fe) => (
            <div key={fe.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-text-main">{fe.descripcion}</p>
                <p className="text-xs text-text-muted">
                  {fe.fecha} · {MODALIDAD_LABELS[fe.modalidad]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-main">${fe.precio.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => onDelete(fe.id)}
                  className="text-red-400 transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
