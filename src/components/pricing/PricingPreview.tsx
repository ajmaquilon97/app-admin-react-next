"use client";

import { Eye } from "lucide-react";
import type { EspacioPricing, Modalidad } from "@/lib/pricing/types";

const DIA_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MOD_LABELS: Record<Modalidad, string> = { hora: "/hora", jornada: "/jornada", evento: "/evento", entrada: "/entrada" };

interface Props {
  pricing: EspacioPricing | null;
  espacioNombre: string | null;
}

export function PricingPreview({ pricing, espacioNombre }: Props) {
  if (!pricing) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-surface p-8 text-center xl:min-h-[400px]">
        <Eye className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-text-muted">Selecciona un espacio para previsualizar tarifas.</p>
      </div>
    );
  }

  const activas = (["hora", "jornada", "evento", "entrada"] as Modalidad[]).filter(
    (m) => pricing.modalidades[m].activa,
  );

  const diasActivos = pricing.tarifasPorDia.filter((d) => d.activo);
  const diasCustom = diasActivos.filter((d) => d.precio != null);

  const precioBase = activas.length > 0
    ? pricing.modalidades[activas[0]].precio
    : null;

  const descuento = pricing.promociones.find((p) => p.activa);
  const precioFinal =
    precioBase != null && descuento
      ? descuento.tipo === "porcentaje"
        ? precioBase * (1 - descuento.valor / 100)
        : precioBase - descuento.valor
      : precioBase;

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-4 w-4 text-[#487AD0]" />
        <h2 className="text-base font-semibold text-text-main">Vista Previa</h2>
      </div>

      {/* Nombre espacio */}
      {espacioNombre && (
        <p className="mb-4 text-sm font-medium text-text-muted">{espacioNombre}</p>
      )}

      {/* Precio principal */}
      <div className="mb-5 rounded-xl bg-[#487AD0]/5 p-4">
        {activas.length === 0 ? (
          <p className="text-sm text-text-muted text-center">Sin modalidades activas</p>
        ) : (
          activas.map((m) => {
            const cfg = pricing.modalidades[m];
            return (
              <div key={m} className="mb-2 last:mb-0 flex items-baseline justify-between">
                <span className="text-xs text-text-muted capitalize">{m}</span>
                <span className="text-xl font-bold text-[#487AD0]">
                  {cfg.precio != null ? (
                    <>
                      ${cfg.precio.toFixed(2)}
                      <span className="text-xs font-normal text-text-muted">
                        {MOD_LABELS[m]}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-normal text-text-muted">Sin precio</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Disponibilidad */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
          Disponibilidad
        </p>
        <div className="flex gap-1.5">
          {pricing.tarifasPorDia.map((d) => (
            <div
              key={d.dia}
              title={d.activo ? "Disponible" : "No disponible"}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                d.activo
                  ? "bg-[#27AE60]/10 text-[#27AE60]"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {DIA_SHORT[d.dia]}
            </div>
          ))}
        </div>
      </div>

      {/* Precios especiales por día */}
      {diasCustom.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
            Precios especiales
          </p>
          <div className="space-y-1">
            {diasCustom.map((d) => (
              <div key={d.dia} className="flex justify-between text-sm">
                <span className="text-text-muted">{DIA_SHORT[d.dia]}</span>
                <span className="font-medium text-text-main">${d.precio!.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promoción activa */}
      {descuento && precioBase != null && (
        <div className="rounded-xl bg-[#8F0E55]/5 px-4 py-3">
          <p className="text-xs font-medium text-[#8F0E55]">🏷 {descuento.nombre}</p>
          <p className="mt-0.5 text-xs text-text-muted">{descuento.condicion}</p>
          {precioFinal != null && (
            <p className="mt-1 text-sm font-bold text-[#8F0E55]">
              Precio final: ${precioFinal.toFixed(2)}
              <span className="text-xs font-normal">
                {activas[0] ? MOD_LABELS[activas[0]] : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Fechas especiales */}
      {pricing.fechasEspeciales.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
            Fechas especiales ({pricing.fechasEspeciales.length})
          </p>
          <div className="space-y-1">
            {pricing.fechasEspeciales.slice(0, 3).map((fe) => (
              <div key={fe.id} className="flex justify-between text-xs">
                <span className="text-text-muted">{fe.fecha} · {fe.descripcion}</span>
                <span className="font-medium text-text-main">${fe.precio.toFixed(2)}</span>
              </div>
            ))}
            {pricing.fechasEspeciales.length > 3 && (
              <p className="text-xs text-text-muted">
                +{pricing.fechasEspeciales.length - 3} más…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
