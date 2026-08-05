/**
 * Deriva el "archetype" de reserva de un espacio a partir del código de su
 * tipoEspacio. El backend todavía no expone un campo formal para esto (ver
 * spec pendiente) — este mapeo es el único lugar a actualizar cuando lo haga.
 */
export type EspacioArchetype = "franja_exclusiva" | "cupo_compartido";

const CODIGO_TO_ARCHETYPE: Record<string, EspacioArchetype> = {
  CAN: "franja_exclusiva", // Canchas deportivas
  SAL: "franja_exclusiva", // Salones de evento
  PIS: "cupo_compartido", // Piscinas
};

/** Tipos desconocidos caen en franja_exclusiva — es el comportamiento actual de toda la app. */
export function getArchetype(tipo?: { codigo?: string | null } | null): EspacioArchetype {
  const codigo = tipo?.codigo?.toUpperCase().trim();
  if (codigo && codigo in CODIGO_TO_ARCHETYPE) return CODIGO_TO_ARCHETYPE[codigo]!;
  return "franja_exclusiva";
}

export function isCupoCompartido(tipo?: { codigo?: string | null } | null): boolean {
  return getArchetype(tipo) === "cupo_compartido";
}
