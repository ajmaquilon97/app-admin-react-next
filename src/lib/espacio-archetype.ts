/**
 * Deriva el "archetype" de reserva de un espacio a partir de `modalidadReserva`
 * (campo real de GET /api/tipos-espacios, ver docs/back_responses/api-specs-aforo.md).
 */
export type EspacioArchetype = "franja_exclusiva" | "cupo_compartido";

const VALID_ARCHETYPES: EspacioArchetype[] = ["franja_exclusiva", "cupo_compartido"];

/** Valores nulos/desconocidos caen en franja_exclusiva — es el comportamiento actual de toda la app. */
export function getArchetype(tipo?: { modalidadReserva?: string | null } | null): EspacioArchetype {
  const valor = tipo?.modalidadReserva;
  if (valor && (VALID_ARCHETYPES as string[]).includes(valor)) return valor as EspacioArchetype;
  return "franja_exclusiva";
}

export function isCupoCompartido(tipo?: { modalidadReserva?: string | null } | null): boolean {
  return getArchetype(tipo) === "cupo_compartido";
}
