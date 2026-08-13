"use client";

import { useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import {
  usePricing,
  useSavePricing,
  useAddFechaEspecial,
  useDeleteFechaEspecial,
  useAddPromocion,
  useTogglePromocion,
  useDeletePromocion,
} from "../hooks/usePricing";
import { espacioPricingSchema } from "../schemas";
import type { EspacioOption, EspacioPricing } from "../types";
import { getArchetype } from "@/lib/domain";
import { SpaceSelector } from "./SpaceSelector";
import { PricingModalities } from "./PricingModalities";
import { DailyRatesTable } from "./DailyRatesTable";
import { SpecialRatesCard } from "./SpecialRatesCard";
import { PromotionsCard } from "./PromotionsCard";
import { PricingPreview } from "./PricingPreview";

interface Props {
  espacios: EspacioOption[];
}

export function PricingPage({ espacios }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    espacios.length > 0 ? espacios[0].id : null,
  );
  const [localPricing, setLocalPricing] = useState<EspacioPricing | null>(null);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: pricing, isLoading } = usePricing(selectedId);
  const saveMut = useSavePricing();
  const addFecha = useAddFechaEspecial(selectedId ?? 0);
  const delFecha = useDeleteFechaEspecial(selectedId ?? 0);
  const addPromo = useAddPromocion(selectedId ?? 0);
  const togglePromo = useTogglePromocion(selectedId ?? 0);
  const delPromo = useDeletePromocion(selectedId ?? 0);

  // Resincroniza el borrador editable cuando llegan datos frescos de React Query
  // (al cambiar de espacio o tras guardar). Se ajusta durante el render en vez de
  // con un efecto: React re-renderiza de inmediato sin pintar antes el valor viejo.
  // Mismo patrón que GeneralScheduleCard — ver "Adjusting some state when a prop
  // changes" en react.dev.
  const [syncedPricing, setSyncedPricing] = useState(pricing);
  if (pricing && pricing !== syncedPricing) {
    setSyncedPricing(pricing);
    setLocalPricing(structuredClone(pricing));
  }

  // Cambio de espacio: limpiar local
  const handleSelectEspacio = (id: number) => {
    setSelectedId(id);
    setLocalPricing(null);
    setActionError(null);
  };

  const handleSave = () => {
    if (!localPricing) return;
    setActionError(null);

    const parsed = espacioPricingSchema.safeParse(localPricing);
    if (!parsed.success) {
      setActionError(parsed.error.issues[0]?.message ?? "Revisa los precios ingresados.");
      return;
    }

    saveMut.mutate(localPricing, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err) => setActionError(err instanceof Error ? err.message : "No se pudo guardar el tarifario."),
    });
  };

  const onMutationError = (err: unknown) =>
    setActionError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");

  const selectedEspacio = espacios.find((e) => e.id === selectedId) ?? null;
  const espacioNombre = selectedEspacio?.nombre ?? null;
  const archetype = getArchetype({ modalidadReserva: selectedEspacio?.modalidadReserva ?? null });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="page-title">Gestión de Tarifas</h1>
          <p className="mt-1 max-w-lg text-sm text-text-muted">
            Configura los precios, modalidades y promociones de cada espacio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SpaceSelector
            espacios={espacios}
            selected={selectedId}
            onChange={handleSelectEspacio}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!localPricing || saveMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#1E3A5F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a6abf] disabled:opacity-50"
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Error de alguna acción contra el backend */}
      {actionError && (
        <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Sin espacios */}
      {espacios.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-text-muted">Crea tu primer espacio para configurar tarifas.</p>
        </div>
      )}

      {/* Loading */}
      {selectedId && isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Contenido */}
      {localPricing && !isLoading && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Columna izquierda */}
          <div className="space-y-6">
            <PricingModalities pricing={localPricing} onChange={setLocalPricing} archetype={archetype} />
            <DailyRatesTable pricing={localPricing} onChange={setLocalPricing} />
            <SpecialRatesCard
              fechas={localPricing.fechasEspeciales}
              onAdd={(fe) => addFecha.mutateAsync(fe)}
              onDelete={(id) => { setActionError(null); delFecha.mutate(id, { onError: onMutationError }); }}
              loading={addFecha.isPending}
              archetype={archetype}
            />
            <PromotionsCard
              promociones={localPricing.promociones}
              onAdd={(p) => addPromo.mutateAsync(p)}
              onToggle={(id, activa) => {
                setActionError(null);
                togglePromo.mutate({ id, activa }, { onError: onMutationError });
              }}
              onDelete={(id) => { setActionError(null); delPromo.mutate(id, { onError: onMutationError }); }}
              loading={addPromo.isPending}
            />
          </div>

          {/* Columna derecha — preview sticky */}
          <div className="xl:sticky xl:top-6 xl:self-start">
            <PricingPreview pricing={localPricing} espacioNombre={espacioNombre} />
          </div>
        </div>
      )}
    </div>
  );
}
