/**
 * Server Actions del módulo de tarifas.
 *
 * El punto delicado es `savePricing`: la UI permite dejar en blanco el precio de
 * un día activo (significa "usa el precio base"), pero el backend exige un valor.
 * La resolución de ese precio base ocurre aquí, y equivocarla haría cobrar de
 * menos —o nada— un día completo, así que se prueba caso por caso.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/modules/pricing/api/pricing", () => ({
  getEspacioTarifas: jest.fn(),
  saveEspacioTarifas: jest.fn(),
  addFechaEspecial: jest.fn(),
  deleteFechaEspecial: jest.fn(),
  addPromocion: jest.fn(),
  togglePromocion: jest.fn(),
  deletePromocion: jest.fn(),
}));

import * as pricingApi from "@/modules/pricing/api/pricing";
import { getSessionTokens } from "@/lib/auth/session";
import * as actions from "@/modules/pricing/actions/pricing";
import type { EspacioPricing } from "@/modules/pricing";

const api = jest.mocked(pricingApi);
const sesion = jest.mocked(getSessionTokens);
const TOKEN = "tok";

function respuestaApi(overrides: Record<string, unknown> = {}) {
  return {
    espacioId: 1,
    horaActiva: true,
    horaPrecio: 25,
    jornadaActiva: false,
    jornadaPrecio: null,
    eventoActiva: false,
    eventoPrecio: null,
    entradaActiva: false,
    entradaPrecio: null,
    tarifasPorDia: [{ dia: 0, activo: true, precio: 30 }],
    ...overrides,
  };
}

function modalidades(overrides: Partial<EspacioPricing["modalidades"]> = {}) {
  return {
    hora: { activa: true, precio: 25 },
    jornada: { activa: false, precio: null },
    evento: { activa: false, precio: null },
    entrada: { activa: false, precio: null },
    ...overrides,
  } as EspacioPricing["modalidades"];
}

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
});

describe("getPricing", () => {
  it("agrupa las cuatro modalidades planas del backend en un objeto por clave", async () => {
    api.getEspacioTarifas.mockResolvedValue(
      respuestaApi({ jornadaActiva: true, jornadaPrecio: 150 }) as never,
    );

    const pricing = await actions.getPricing(1);

    expect(pricing.modalidades).toEqual({
      hora: { activa: true, precio: 25 },
      jornada: { activa: true, precio: 150 },
      evento: { activa: false, precio: null },
      entrada: { activa: false, precio: null },
    });
  });

  /** El backend omite los arreglos vacíos en vez de mandar `[]`. */
  it("normaliza a arreglo vacío las listas que el backend omite", async () => {
    api.getEspacioTarifas.mockResolvedValue(respuestaApi() as never);

    const pricing = await actions.getPricing(1);

    expect(pricing.fechasEspeciales).toEqual([]);
    expect(pricing.promociones).toEqual([]);
  });

  it("mapea fechas especiales y promociones cuando sí vienen", async () => {
    api.getEspacioTarifas.mockResolvedValue(
      respuestaApi({
        fechasEspeciales: [
          { id: "f1", fecha: "2026-12-25", descripcion: "Navidad", precio: 80, modalidad: "evento" },
        ],
        promociones: [
          { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 50, activa: true, condicion: null },
        ],
      }) as never,
    );

    const pricing = await actions.getPricing(1);

    expect(pricing.fechasEspeciales[0]).toEqual({
      id: "f1",
      fecha: "2026-12-25",
      descripcion: "Navidad",
      precio: 80,
      modalidad: "evento",
    });
    // Una condición nula se muestra como cadena vacía: el input del formulario
    // es controlado y `null` lo volvería no controlado.
    expect(pricing.promociones[0]!.condicion).toBe("");
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);
    await expect(actions.getPricing(1)).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.getEspacioTarifas).not.toHaveBeenCalled();
  });
});

describe("savePricing — resolución del precio base por día", () => {
  beforeEach(() => api.saveEspacioTarifas.mockResolvedValue(respuestaApi() as never));

  it("aplana las modalidades al formato que espera el backend", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades({ jornada: { activa: true, precio: 150 } }),
      tarifasPorDia: [],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        horaActiva: true,
        horaPrecio: 25,
        jornadaActiva: true,
        jornadaPrecio: 150,
        entradaActiva: false,
        entradaPrecio: null,
      }),
      TOKEN,
    );
  });

  it("rellena con el precio por hora el día activo sin precio propio", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades(),
      tarifasPorDia: [{ dia: 0, activo: true, precio: null }],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ tarifasPorDia: [{ dia: 0, activo: true, precio: 25 }] }),
      TOKEN,
    );
  });

  /** En cupo compartido la modalidad principal es "entrada", no "hora". */
  it("usa el precio de entrada como base cuando el espacio no cobra por hora", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades({
        hora: { activa: false, precio: null },
        entrada: { activa: true, precio: 8 },
      }),
      tarifasPorDia: [{ dia: 3, activo: true, precio: null }],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ tarifasPorDia: [{ dia: 3, activo: true, precio: 8 }] }),
      TOKEN,
    );
  });

  it("respeta el precio propio de un día y no lo sustituye por el base", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades(),
      tarifasPorDia: [{ dia: 1, activo: true, precio: 40 }],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ tarifasPorDia: [{ dia: 1, activo: true, precio: 40 }] }),
      TOKEN,
    );
  });

  it("no rellena el precio de un día inactivo", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades(),
      tarifasPorDia: [{ dia: 6, activo: false, precio: null }],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ tarifasPorDia: [{ dia: 6, activo: false, precio: null }] }),
      TOKEN,
    );
  });

  it("resuelve cada día de la semana de forma independiente", async () => {
    await actions.savePricing(1, {
      modalidades: modalidades(),
      tarifasPorDia: [
        { dia: 0, activo: true, precio: null },
        { dia: 1, activo: true, precio: 40 },
        { dia: 2, activo: false, precio: null },
      ],
    });

    expect(api.saveEspacioTarifas).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        tarifasPorDia: [
          { dia: 0, activo: true, precio: 25 },
          { dia: 1, activo: true, precio: 40 },
          { dia: 2, activo: false, precio: null },
        ],
      }),
      TOKEN,
    );
  });
});

describe("fechas especiales y promociones", () => {
  it("addFechaEspecial devuelve la fecha ya con el id del backend", async () => {
    api.addFechaEspecial.mockResolvedValue({
      id: "f9",
      fecha: "2026-12-31",
      descripcion: "Fin de año",
      precio: 200,
      modalidad: "evento",
    } as never);

    const creada = await actions.addFechaEspecial(1, {
      fecha: "2026-12-31",
      descripcion: "Fin de año",
      precio: 200,
      modalidad: "evento",
    });

    expect(creada.id).toBe("f9");
    expect(api.addFechaEspecial).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ descripcion: "Fin de año" }),
      TOKEN,
    );
  });

  it("deleteFechaEspecial delega con el espacio y el token", async () => {
    await actions.deleteFechaEspecial(1, "f9");
    expect(api.deleteFechaEspecial).toHaveBeenCalledWith(1, "f9", TOKEN);
  });

  it("addPromocion normaliza la condición ausente", async () => {
    api.addPromocion.mockResolvedValue({
      id: "p2",
      nombre: "Madrugador",
      tipo: "monto_fijo",
      valor: 5,
      activa: true,
      condicion: null,
    } as never);

    const creada = await actions.addPromocion(1, {
      nombre: "Madrugador",
      tipo: "monto_fijo",
      valor: 5,
      activa: true,
      condicion: "Antes de las 9",
    });

    expect(creada.condicion).toBe("");
  });

  it("togglePromocion envía el nuevo estado", async () => {
    api.togglePromocion.mockResolvedValue({
      id: "p1",
      nombre: "2x1",
      tipo: "porcentaje",
      valor: 50,
      activa: false,
      condicion: "",
    } as never);

    const actualizada = await actions.togglePromocion(1, "p1", false);

    expect(api.togglePromocion).toHaveBeenCalledWith(1, "p1", false, TOKEN);
    expect(actualizada.activa).toBe(false);
  });

  it("deletePromocion delega con el espacio y el token", async () => {
    await actions.deletePromocion(1, "p1");
    expect(api.deletePromocion).toHaveBeenCalledWith(1, "p1", TOKEN);
  });
});
