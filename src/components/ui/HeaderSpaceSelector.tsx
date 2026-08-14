"use client";

import { ChevronDown } from "lucide-react";
import type { EspacioOption } from "@/lib/domain";

interface Props {
  espacios: EspacioOption[];
  /** `null` representa "todos los espacios" cuando allowAll=true. */
  value: number | null;
  onChange: (id: number | null) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Único punto de conversión entre el id de espacio del dominio (`number`, forma del
 * backend) y el `string` que impone el DOM en `<select>`. Ningún consumidor debe
 * volver a hacer String()/Number() sobre un id de espacio.
 */

export function HeaderSpaceSelector({
  espacios,
  value,
  onChange,
  allowAll = false,
  allLabel = "Todos los espacios",
  placeholder = "Selecciona un espacio…",
  className = "",
}: Props) {
  return (
    <div className={`relative inline-block w-full max-w-xs ${className}`}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-surface py-2.5 pl-4 pr-10 text-sm font-medium text-text-main shadow-soft focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
      >
        {allowAll && <option value="">{allLabel}</option>}
        {!allowAll && espacios.length === 0 && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {espacios.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
            {e.tipoEspacioNombre ? ` · ${e.tipoEspacioNombre}` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
