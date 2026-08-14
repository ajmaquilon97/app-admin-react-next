"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { perfilSchema, type PerfilForm } from "../schemas";
import { usePerfil, useUpdatePerfil } from "../hooks/useConfiguracion";

export function PerfilTab() {
  const { data: perfil, isLoading } = usePerfil();
  const updatePerfil = useUpdatePerfil();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PerfilForm>({ resolver: zodResolver(perfilSchema) });

  useEffect(() => {
    if (perfil) reset(perfil);
  }, [perfil, reset]);

  const submit = (data: PerfilForm) => {
    updatePerfil.mutate(data, {
      onSuccess: () => toast.success("Perfil actualizado."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el perfil."),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Nombre</label>
          <input
            type="text"
            {...register("nombre")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
          />
          {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Apellido</label>
          <input
            type="text"
            {...register("apellido")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
          />
          {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Correo</label>
          <input
            type="email"
            disabled
            {...register("email")}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-muted"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Teléfono</label>
          <input
            type="tel"
            disabled
            placeholder="Sin registrar"
            {...register("telefono")}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-muted"
          />
          <p className="mt-1 text-caption">Se gestiona mediante verificación por SMS, no editable aquí.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Cédula</label>
          <input
            type="text"
            {...register("numeroCedula")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
          />
          {errors.numeroCedula && <p className="mt-1 text-xs text-red-500">{errors.numeroCedula.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Fecha de nacimiento</label>
          <input
            type="date"
            {...register("fechaNacimiento")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
          />
          {errors.fechaNacimiento && (
            <p className="mt-1 text-xs text-red-500">{errors.fechaNacimiento.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-text-main">Foto de perfil</h3>
          <Controller
            control={control}
            name="fotoPerfilUrl"
            render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />}
          />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-text-main">Documento de identidad</h3>
          <Controller
            control={control}
            name="documentoIdentidadUrl"
            render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updatePerfil.isPending}
          className="flex items-center gap-2 rounded-xl bg-[#1E3A5F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a6abf] disabled:opacity-50"
        >
          {updatePerfil.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
