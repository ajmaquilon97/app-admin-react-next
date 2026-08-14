"use client";

import { ChevronDown } from "lucide-react";
import type { EspacioOption } from "../types";

interface Props {
  espacios: EspacioOption[];
  selected: number | null;
  onChange: (id: number) => void;
}

export function SpaceSelector({ espacios, selected, onChange }: Props) {
  return (
    <div className="relative inline-block w-full max-w-sm">
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-surface py-2.5 pl-4 pr-10 text-sm font-medium text-text-main shadow-soft focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
      >
        <option value="" disabled>
          Selecciona un espacio…
        </option>
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
