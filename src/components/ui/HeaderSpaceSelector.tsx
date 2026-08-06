"use client";

import { ChevronDown } from "lucide-react";

export interface HeaderSpaceOption {
  id: string;
  nombre: string;
  tipoEspacioNombre?: string | null;
}

interface Props {
  espacios: HeaderSpaceOption[];
  /** "" representa "todos los espacios" cuando allowAll=true. */
  value: string;
  onChange: (id: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
}

/** Selector de espacio destacado en el header de página — mismo estilo que /tarifas. */
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
