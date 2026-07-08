"use client";

import type { EspacioPricing, Modalidad } from "@/lib/pricing/types";

const LABELS: Record<Modalidad, { label: string; desc: string }> = {
  hora:    { label: "Por Hora",    desc: "Alquiler por franja horaria" },
  jornada: { label: "Por Jornada", desc: "Media jornada o jornada completa" },
  evento:  { label: "Por Evento",  desc: "Precio fijo por evento completo" },
};

interface Props {
  pricing: EspacioPricing;
  onChange: (pricing: EspacioPricing) => void;
}

export function PricingModalities({ pricing, onChange }: Props) {
  const update = (mod: Modalidad, field: "activa" | "precio", value: boolean | number | null) => {
    onChange({
      ...pricing,
      modalidades: {
        ...pricing.modalidades,
        [mod]: { ...pricing.modalidades[mod], [field]: value },
      },
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <h2 className="mb-4 text-base font-semibold text-text-main">Modalidades de Cobro</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {(["hora", "jornada", "evento"] as Modalidad[]).map((mod) => {
          const cfg = pricing.modalidades[mod];
          const meta = LABELS[mod];
          return (
            <div
              key={mod}
              className={`rounded-xl border p-4 transition-all ${
                cfg.activa
                  ? "border-[#487AD0]/30 bg-[#487AD0]/5"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-main">{meta.label}</p>
                  <p className="text-xs text-text-muted">{meta.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => update(mod, "activa", !cfg.activa)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    cfg.activa ? "bg-[#487AD0]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      cfg.activa ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {cfg.activa && (
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={cfg.precio ?? ""}
                    onChange={(e) =>
                      update(mod, "precio", e.target.value === "" ? null : Number(e.target.value))
                    }
                    className="block w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-[#487AD0] focus:outline-none focus:ring-2 focus:ring-[#487AD0]/20"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
