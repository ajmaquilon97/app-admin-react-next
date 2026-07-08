"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  usePricing,
  useSavePricing,
  useAddFechaEspecial,
  useDeleteFechaEspecial,
  useAddPromocion,
  useTogglePromocion,
  useDeletePromocion,
} from "@/lib/pricing/hooks";
import type { EspacioOption, EspacioPricing } from "@/lib/pricing/types";
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
  };

  const handleSave = () => {
    if (!localPricing) return;
    saveMut.mutate(localPricing, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const espacioNombre =
    espacios.find((e) => e.id === selectedId)?.titulo ?? null;

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
            <PricingModalities pricing={localPricing} onChange={setLocalPricing} />
            <DailyRatesTable pricing={localPricing} onChange={setLocalPricing} />
            <SpecialRatesCard
              fechas={localPricing.fechasEspeciales}
              onAdd={(fe) => addFecha.mutate(fe)}
              onDelete={(id) => delFecha.mutate(id)}
              loading={addFecha.isPending}
            />
            <PromotionsCard
              promociones={localPricing.promociones}
              onAdd={(p) => addPromo.mutate(p)}
              onToggle={(id, activa) => togglePromo.mutate({ id, activa })}
              onDelete={(id) => delPromo.mutate(id)}
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
