import { perfilSchema, negocioSchema } from "@/modules/configuracion/schemas";
import { CONFIRMATION_MODE_OPTIONS, configuracionKeys } from "@/modules/configuracion/constants";
import type { ReservationConfirmationMode } from "@/modules/configuracion";

/**
 * Validación de configuración.
 *
 * El caso interesante es `negocioSchema`: además de las reglas por campo tiene
 * una regla cruzada —no se puede elegir ciudad sin provincia— que refleja una
 * restricción real del backend (`ciudadId` exige `provinciaId`).
 */

describe("perfilSchema", () => {
  const valido = {
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana@negocio.com",
    telefono: "",
    fotoPerfilUrl: "",
    documentoIdentidadUrl: "",
    numeroCedula: "0912345678",
    fechaNacimiento: "1995-04-02",
  };

  it("acepta un perfil completo", () => {
    expect(perfilSchema.safeParse(valido).success).toBe(true);
  });

  /**
   * `telefono` no lleva `min()` a propósito: `getPerfil()` siempre lo devuelve
   * vacío porque el backend no lo expone, y exigirlo bloquearía el guardado del
   * resto del formulario.
   */
  it("admite el teléfono vacío, que es como siempre llega del backend", () => {
    expect(perfilSchema.safeParse({ ...valido, telefono: "" }).success).toBe(true);
  });

  it.each([
    ["nombre", "Nombre requerido"],
    ["apellido", "Apellido requerido"],
    ["numeroCedula", "Cédula requerida"],
    ["fechaNacimiento", "Fecha de nacimiento requerida"],
  ])("exige el campo %s", (campo, mensaje) => {
    const r = perfilSchema.safeParse({ ...valido, [campo]: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === mensaje)).toBe(true);
  });

  it("rechaza un correo mal formado", () => {
    const r = perfilSchema.safeParse({ ...valido, email: "no-es-correo" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "Correo inválido")).toBe(true);
  });
});

describe("negocioSchema", () => {
  const valido = {
    nombreNegocio: "Canchas del Sur",
    ruc: "0912345678001",
    razonSocial: "Canchas del Sur S.A.",
    categoria: "Deportivo",
    direccion: "Av. Principal 123",
    provinciaId: 9,
    ciudadId: 90,
    telefonoNegocio: "042345678",
    descripcion: "Complejo deportivo",
    logoUrl: "",
  };

  it("acepta un negocio completo", () => {
    expect(negocioSchema.safeParse(valido).success).toBe(true);
  });

  it.each([
    ["091234567800", "12 dígitos"],
    ["09123456780012", "14 dígitos"],
    ["", "vacío"],
  ])("rechaza un RUC de %s (%s)", (ruc) => {
    const r = negocioSchema.safeParse({ ...valido, ruc });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "El RUC debe tener 13 dígitos")).toBe(true);
    }
  });

  it("exige al menos 7 dígitos en el teléfono", () => {
    expect(negocioSchema.safeParse({ ...valido, telefonoNegocio: "12345" }).success).toBe(false);
    expect(negocioSchema.safeParse({ ...valido, telefonoNegocio: "1234567" }).success).toBe(true);
  });

  it.each(["nombreNegocio", "razonSocial", "categoria", "direccion", "descripcion"])(
    "exige el campo %s",
    (campo) => {
      expect(negocioSchema.safeParse({ ...valido, [campo]: "" }).success).toBe(false);
    },
  );

  /** El backend rechaza `ciudadId` sin `provinciaId`: la regla se replica en el cliente. */
  it("no permite elegir ciudad sin provincia", () => {
    const r = negocioSchema.safeParse({ ...valido, provinciaId: 0, ciudadId: 90 });

    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path[0] === "ciudadId");
      expect(issue?.message).toBe("Selecciona una provincia para poder elegir la ciudad");
    }
  });

  it("permite dejar ambas ubicaciones sin seleccionar", () => {
    expect(negocioSchema.safeParse({ ...valido, provinciaId: 0, ciudadId: 0 }).success).toBe(true);
  });

  it("permite provincia sin ciudad", () => {
    expect(negocioSchema.safeParse({ ...valido, provinciaId: 9, ciudadId: 0 }).success).toBe(true);
  });

  it("rechaza identificadores de ubicación negativos", () => {
    expect(negocioSchema.safeParse({ ...valido, provinciaId: -1 }).success).toBe(false);
  });
});

describe("CONFIRMATION_MODE_OPTIONS", () => {
  it("ofrece exactamente los tres modos del dominio", () => {
    const modos: ReservationConfirmationMode[] = [
      "inmediata",
      "pago_confirmacion_manual",
      "solicitud_aprobacion",
    ];
    expect(CONFIRMATION_MODE_OPTIONS.map((o) => o.value)).toEqual(modos);
  });

  it("cada modo se explica al anfitrión, no solo se nombra", () => {
    for (const opcion of CONFIRMATION_MODE_OPTIONS) {
      expect(opcion.label.length).toBeGreaterThan(0);
      expect(opcion.description.length).toBeGreaterThan(20);
    }
  });
});

describe("configuracionKeys", () => {
  it("separa la caché de perfil, negocio y configuración de reservas", () => {
    const claves = [
      configuracionKeys.perfil,
      configuracionKeys.negocio,
      configuracionKeys.bookingConfigs,
    ].map((c) => JSON.stringify(c));

    expect(new Set(claves).size).toBe(3);
    expect(configuracionKeys.perfil[0]).toBe("configuracion");
  });
});
