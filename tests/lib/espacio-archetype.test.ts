import { getArchetype, isCupoCompartido } from "@/lib/domain";

/**
 * `getArchetype()` es el único punto donde la app decide si un espacio se reserva
 * por franja exclusiva o por cupo compartido. Un fallo aquí cambia la UI de
 * reservas, disponibilidad y tarifas a la vez, así que se prueba exhaustivamente
 * incluida la rama de valores desconocidos.
 */
describe("getArchetype", () => {
  it("devuelve el arquetipo cuando la modalidad es válida", () => {
    expect(getArchetype({ modalidadReserva: "franja_exclusiva" })).toBe("franja_exclusiva");
    expect(getArchetype({ modalidadReserva: "cupo_compartido" })).toBe("cupo_compartido");
  });

  it.each([
    ["undefined como argumento", undefined],
    ["null como argumento", null],
    ["objeto sin modalidad", {}],
    ["modalidad null", { modalidadReserva: null }],
    ["modalidad vacía", { modalidadReserva: "" }],
    ["modalidad desconocida", { modalidadReserva: "por_evento" }],
  ])("cae en franja_exclusiva con %s", (_caso, entrada) => {
    expect(getArchetype(entrada)).toBe("franja_exclusiva");
  });

  it("no acepta valores que solo se parezcan al arquetipo", () => {
    expect(getArchetype({ modalidadReserva: "FRANJA_EXCLUSIVA" })).toBe("franja_exclusiva");
    expect(getArchetype({ modalidadReserva: "cupo compartido" })).toBe("franja_exclusiva");
  });
});

describe("isCupoCompartido", () => {
  it("solo es verdadero para cupo_compartido", () => {
    expect(isCupoCompartido({ modalidadReserva: "cupo_compartido" })).toBe(true);
    expect(isCupoCompartido({ modalidadReserva: "franja_exclusiva" })).toBe(false);
    expect(isCupoCompartido(null)).toBe(false);
    expect(isCupoCompartido(undefined)).toBe(false);
  });
});
