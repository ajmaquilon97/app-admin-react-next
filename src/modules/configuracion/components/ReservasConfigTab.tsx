"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CONFIRMATION_MODE_OPTIONS } from "../constants";
import { useBookingConfigs, useUpdateBookingConfig } from "../hooks/useConfiguracion";
import type { EspacioOption, ReservationConfirmationMode } from "../types";

function ConfigRow({ espacioId, espacioNombre, modo }: { espacioId: string; espacioNombre: string; modo: ReservationConfirmationMode }) {
  const updateConfig = useUpdateBookingConfig();
  const selected = CONFIRMATION_MODE_OPTIONS.find((o) => o.value === modo);

  const handleChange = (next: ReservationConfirmationMode) => {
    updateConfig.mutate(
      { espacioId, espacioNombre, modo: next },
      {
        onSuccess: () => toast.success(`Modo de reservas actualizado para "${espacioNombre}".`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "No se pudo actualizar la configuración."),
      },
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-[#1F2937]">{espacioNombre}</p>
        <div className="flex items-center gap-2">
          {updateConfig.isPending && <Loader2 className="h-4 w-4 animate-spin text-[#487AD0]" />}
          <select
            value={modo}
            disabled={updateConfig.isPending}
            onChange={(e) => handleChange(e.target.value as ReservationConfirmationMode)}
            className="w-full min-w-[280px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#487AD0] focus:outline-none md:w-auto"
          >
            {CONFIRMATION_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selected && <p className="mt-2 text-xs text-[#6B7280]">{selected.description}</p>}
    </div>
  );
}

export function ReservasConfigTab({ espacios }: { espacios: EspacioOption[] }) {
  const { data: configs = [], isLoading } = useBookingConfigs(espacios);

  if (espacios.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <p className="text-[#6B7280]">Crea tu primer espacio para configurar cómo se aceptan sus reservas.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#487AD0]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-[#6B7280]">
        Define, para cada espacio, cómo se acepta una reserva cuando un usuario la solicita.
      </p>
      {configs.map((c) => (
        <ConfigRow key={c.espacioId} espacioId={c.espacioId} espacioNombre={c.espacioNombre} modo={c.modo} />
      ))}
    </div>
  );
}
