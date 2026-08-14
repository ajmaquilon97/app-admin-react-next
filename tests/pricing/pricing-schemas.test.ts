import {
  modalidadConfigSchema,
  tarifaDiaSchema,
  fechaEspecialSchema,
  promocionSchema,
  espacioPricingSchema,
} from "@/modules/pricing/schemas";
import { pricingKeys } from "@/modules/pricing/constants";

/**
 * Validación de tarifas.
 *
 * Todo importe que llegue a estos esquemas termina cobrándose a un cliente, así
 * que la regla dura es la misma en los cuatro: un precio, si existe, es
 * estrictamente positivo. El cero y los negativos se rechazan; `null` es válido
 * solo donde significa "hereda el precio base".
 */

describe("modalidadConfigSchema", () => {
  it("acepta una modalidad activa con precio", () => {
    expect(modalidadConfigSchema.safeParse({ activa: true, precio: 25 }).success).toBe(true);
  });

  it("acepta precio nulo — la modalidad hereda el precio base", () => {
    expect(modalidadConfigSchema.safeParse({ activa: false, precio: null }).success).toBe(true);
  });

  it.each([0, -1, -0.5])("rechaza el precio %p", (precio) => {
    const r = modalidadConfigSchema.safeParse({ activa: true, precio });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toBe("Debe ser mayor a 0");
  });
});

describe("tarifaDiaSchema", () => {
  it.each([0, 1, 2, 3, 4, 5, 6])("acepta el día %i de la semana", (dia) => {
    expect(tarifaDiaSchema.safeParse({ dia, activo: true, precio: 20 }).success).toBe(true);
  });

  it.each([-1, 7, 99])("rechaza el día %i, fuera del rango semanal", (dia) => {
    expect(tarifaDiaSchema.safeParse({ dia, activo: true, precio: 20 }).success).toBe(false);
  });

  it("rechaza un precio no positivo", () => {
    expect(tarifaDiaSchema.safeParse({ dia: 0, activo: true, precio: 0 }).success).toBe(false);
  });
});

describe("fechaEspecialSchema", () => {
  const valida = {
    fecha: "2026-12-25",
    descripcion: "Navidad",
    precio: 80,
    modalidad: "evento" as const,
  };

  it("acepta una fecha especial completa", () => {
    expect(fechaEspecialSchema.safeParse(valida).success).toBe(true);
  });

  it.each([
    ["fecha", "Selecciona una fecha"],
    ["descripcion", "Agrega una descripción"],
  ])("exige el campo %s", (campo, mensaje) => {
    const r = fechaEspecialSchema.safeParse({ ...valida, [campo]: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === mensaje)).toBe(true);
  });

  /** A diferencia de las modalidades, aquí el precio es obligatorio: no hay base que heredar. */
  it("no admite precio nulo", () => {
    expect(fechaEspecialSchema.safeParse({ ...valida, precio: null }).success).toBe(false);
  });

  it.each(["hora", "jornada", "evento", "entrada"] as const)(
    "acepta la modalidad %s",
    (modalidad) => {
      expect(fechaEspecialSchema.safeParse({ ...valida, modalidad }).success).toBe(true);
    },
  );

  it("rechaza una modalidad inexistente", () => {
    expect(fechaEspecialSchema.safeParse({ ...valida, modalidad: "mensual" }).success).toBe(false);
  });
});

describe("promocionSchema", () => {
  const valida = {
    nombre: "2x1 martes",
    tipo: "porcentaje" as const,
    valor: 50,
    activa: true,
    condicion: "Solo martes",
  };

  it("acepta una promoción completa", () => {
    expect(promocionSchema.safeParse(valida).success).toBe(true);
  });

  it.each(["porcentaje", "monto_fijo"] as const)("acepta el tipo %s", (tipo) => {
    expect(promocionSchema.safeParse({ ...valida, tipo }).success).toBe(true);
  });

  it("exige nombre y condición", () => {
    expect(promocionSchema.safeParse({ ...valida, nombre: "" }).success).toBe(false);
    expect(promocionSchema.safeParse({ ...valida, condicion: "" }).success).toBe(false);
  });

  it("rechaza un descuento de valor cero", () => {
    expect(promocionSchema.safeParse({ ...valida, valor: 0 }).success).toBe(false);
  });
});

describe("espacioPricingSchema", () => {
  it("valida el conjunto de modalidades y tarifas por día", () => {
    const r = espacioPricingSchema.safeParse({
      modalidades: {
        hora: { activa: true, precio: 25 },
        jornada: { activa: false, precio: null },
        evento: { activa: false, precio: null },
        entrada: { activa: false, precio: null },
      },
      tarifasPorDia: [{ dia: 0, activo: true, precio: 30 }],
    });
    expect(r.success).toBe(true);
  });

  it("propaga el fallo de una modalidad anidada", () => {
    const r = espacioPricingSchema.safeParse({
      modalidades: { hora: { activa: true, precio: -5 } },
      tarifasPorDia: [],
    });
    expect(r.success).toBe(false);
  });
});

describe("pricingKeys", () => {
  it("aísla la caché de tarifas por espacio", () => {
    expect(pricingKeys.byEspacio(1)).toEqual(["pricing", 1]);
    expect(pricingKeys.byEspacio(1)).not.toEqual(pricingKeys.byEspacio(2));
    expect(pricingKeys.byEspacio(1)[0]).toBe(pricingKeys.all[0]);
  });
});
