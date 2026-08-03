"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { ProvinciaCatalogo } from "@/lib/catalogos-api";
import { negocioSchema, type NegocioForm } from "../schemas";
import { useNegocio, useUpdateNegocio } from "../hooks/useConfiguracion";

export function NegocioTab({ provincias }: { provincias: ProvinciaCatalogo[] }) {
  const { data: negocio, isLoading } = useNegocio();
  const updateNegocio = useUpdateNegocio();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NegocioForm>({ resolver: zodResolver(negocioSchema) });

  useEffect(() => {
    if (negocio) reset(negocio);
  }, [negocio, reset]);

  const provinciaNombre = watch("provincia");
  const ciudadesDisponibles = useMemo(
    () => provincias.find((p) => p.nombre === provinciaNombre)?.ciudades ?? [],
    [provincias, provinciaNombre],
  );

  useEffect(() => {
    if (ciudadesDisponibles.length > 0 && !ciudadesDisponibles.some((c) => c.nombre === watch("ciudad"))) {
      setValue("ciudad", ciudadesDisponibles[0].nombre);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinciaNombre, ciudadesDisponibles]);

  const submit = (data: NegocioForm) => {
    updateNegocio.mutate(data, {
      onSuccess: () => toast.success("Datos del negocio actualizados."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el negocio."),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#487AD0]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#1F2937]">Logo del negocio</h3>
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="grid gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Nombre del negocio</label>
          <input
            type="text"
            {...register("nombreNegocio")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.nombreNegocio && <p className="mt-1 text-xs text-red-500">{errors.nombreNegocio.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">RUC</label>
          <input
            type="text"
            maxLength={13}
            {...register("ruc")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.ruc && <p className="mt-1 text-xs text-red-500">{errors.ruc.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Razón social</label>
          <input
            type="text"
            {...register("razonSocial")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.razonSocial && <p className="mt-1 text-xs text-red-500">{errors.razonSocial.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Categoría</label>
          <input
            type="text"
            {...register("categoria")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.categoria && <p className="mt-1 text-xs text-red-500">{errors.categoria.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Teléfono del negocio</label>
          <input
            type="tel"
            {...register("telefonoNegocio")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.telefonoNegocio && (
            <p className="mt-1 text-xs text-red-500">{errors.telefonoNegocio.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Dirección</label>
          <input
            type="text"
            {...register("direccion")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.direccion && <p className="mt-1 text-xs text-red-500">{errors.direccion.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Provincia</label>
          <select
            {...register("provincia")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          >
            <option value="">Selecciona una provincia</option>
            {provincias.map((p) => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
          {errors.provincia && <p className="mt-1 text-xs text-red-500">{errors.provincia.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Ciudad</label>
          <select
            {...register("ciudad")}
            disabled={!provinciaNombre}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none disabled:bg-gray-50"
          >
            <option value="">Selecciona una ciudad</option>
            {ciudadesDisponibles.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          {errors.ciudad && <p className="mt-1 text-xs text-red-500">{errors.ciudad.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[#6B7280]">Descripción</label>
          <textarea
            rows={3}
            {...register("descripcion")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none"
          />
          {errors.descripcion && <p className="mt-1 text-xs text-red-500">{errors.descripcion.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateNegocio.isPending}
          className="flex items-center gap-2 rounded-xl bg-[#487AD0] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a6abf] disabled:opacity-50"
        >
          {updateNegocio.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
