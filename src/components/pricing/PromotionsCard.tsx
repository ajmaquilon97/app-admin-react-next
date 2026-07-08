"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Tag } from "lucide-react";
import { promocionSchema, type PromocionForm } from "@/lib/pricing/schemas";
import type { Promocion } from "@/lib/pricing/types";

interface Props {
  promociones: Promocion[];
  onAdd: (p: Omit<Promocion, "id">) => void;
  onToggle: (id: string, activa: boolean) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function PromotionsCard({ promociones, onAdd, onToggle, onDelete, loading }: Props) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromocionForm>({
    resolver: zodResolver(promocionSchema),
    defaultValues: { tipo: "porcentaje", activa: true },
  });

  const submit = (data: PromocionForm) => {
    onAdd(data);
    reset();
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-main">Promociones</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-[#8F0E55] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#760b46]"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit(submit)}
          className="mb-4 rounded-xl border border-[#8F0E55]/20 bg-[#8F0E55]/5 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Descuento fin de semana"
                {...register("nombre")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8F0E55] focus:outline-none"
              />
              {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Tipo</label>
              <select
                {...register("tipo")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8F0E55] focus:outline-none"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Valor</label>
              <input
                type="number"
                min={0}
                step={0.01}
                {...register("valor", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8F0E55] focus:outline-none"
              />
              {errors.valor && <p className="mt-1 text-xs text-red-500">{errors.valor.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Condición</label>
              <input
                type="text"
                placeholder="Ej: Reservas de 3+ horas"
                {...register("condicion")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8F0E55] focus:outline-none"
              />
              {errors.condicion && (
                <p className="mt-1 text-xs text-red-500">{errors.condicion.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-text-muted hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#8F0E55] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#760b46] disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {promociones.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-4">Sin promociones activas.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {promociones.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 flex-shrink-0 text-[#8F0E55]" />
                <div>
                  <p className="text-sm font-medium text-text-main">{p.nombre}</p>
                  <p className="text-xs text-text-muted">{p.condicion}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#8F0E55]">
                  {p.tipo === "porcentaje" ? `${p.valor}%` : `$${p.valor.toFixed(2)}`}
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(p.id, !p.activa)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    p.activa ? "bg-[#27AE60]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      p.activa ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
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
