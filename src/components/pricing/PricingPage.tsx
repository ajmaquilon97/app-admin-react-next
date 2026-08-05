"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import {
  usePricing,
  useSavePricing,
  useAddFechaEspecial,
  useDeleteFechaEspecial,
  useAddPromocion,
  useTogglePromocion,
  useDeletePromocion,
} from "@/lib/pricing/hooks";
import { espacioPricingSchema } from "@/lib/pricing/schemas";
import type { EspacioOption, EspacioPricing } from "@/lib/pricing/types";
import { getArchetype } from "@/lib/espacio-archetype";
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

  // Sync remoto → local cuando cambia espacio o llegan datos frescos
  useEffect(() => {
    if (pricing) setLocalPricing(structuredClone(pricing));
  }, [pricing]);

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
  const espacioNombre = selectedEspacio?.titulo ?? null;
  const archetype = getArchetype({ codigo: selectedEspacio?.tipoEspacioCodigo ?? null });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Gestión de Tarifas</h1>
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
            className="flex items-center gap-2 rounded-xl bg-[#487AD0] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a6abf] disabled:opacity-50"
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
          <Loader2 className="h-8 w-8 animate-spin text-[#487AD0]" />
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
            <PricingPreview pricing={localPricing} espacioNombre={espacioNombre} archetype={archetype} />
          </div>
        </div>
      )}
    </div>
  );
}
