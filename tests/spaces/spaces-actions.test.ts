/**
 * Server Actions del módulo de espacios.
 *
 * `createEspacio` y `updateEspacio` reciben un `FormData` crudo —son endpoints
 * públicos— y lo convierten al `EspacioRequest` del backend. La conversión tiene
 * varias trampas: campos opcionales que deben quedar `undefined` (y no `0`) para
 * que el JSON los omita, un arreglo de imágenes que viaja serializado, y el
 * booleano de aforo que llega como cadena.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/modules/spaces/api/spaces", () => {
  class SpacesError extends Error {}
  return {
    SpacesError,
    createEspacio: jest.fn(),
    updateEspacio: jest.fn(),
    activarEspacio: jest.fn(),
    inactivarEspacio: jest.fn(),
  };
});

import { revalidatePath } from "next/cache";
import * as spacesApi from "@/modules/spaces/api/spaces";
import { getSessionTokens } from "@/lib/auth/session";
import * as actions from "@/modules/spaces/actions/spaces";

const api = jest.mocked(spacesApi);
const sesion = jest.mocked(getSessionTokens);
const revalidar = jest.mocked(revalidatePath);
const TOKEN = "tok";

const CAMPOS_COMPLETOS = {
  titulo: "Cancha Norte",
  descripcion: "Césped sintético",
  propietarioId: "u1",
  tipoEspacioId: "3",
  provinciaId: "9",
  ciudadId: "90",
  linkUbicacion: "https://maps.test/x",
  referencia: "Junto al parque",
  latitud: "-2.17",
  longitud: "-79.92",
  validarAforo: "true",
  maxCapacidad: "20",
  imagenPortada: "https://cdn.test/portada.jpg",
  imagenesGaleria: '["https://cdn.test/1.jpg","https://cdn.test/2.jpg"]',
  modoConfirmacion: "inmediata",
};

function formData(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

async function capturarRedirect(ejecutar: () => Promise<unknown>): Promise<string> {
  try {
    await ejecutar();
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";
    if (mensaje.startsWith("NEXT_REDIRECT:")) return mensaje.slice("NEXT_REDIRECT:".length);
    throw error;
  }
  throw new Error("Se esperaba un redirect y la action terminó sin redirigir.");
}

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("createEspacio", () => {
  it("convierte el FormData al request del backend y vuelve al listado", async () => {
    const destino = await capturarRedirect(() =>
      actions.createEspacio(undefined, formData(CAMPOS_COMPLETOS)),
    );

    expect(api.createEspacio).toHaveBeenCalledWith(
      {
        titulo: "Cancha Norte",
        descripcion: "Césped sintético",
        propietarioId: "u1",
        tipoEspacioId: 3,
        provinciaId: 9,
        ciudadId: 90,
        linkUbicacion: "https://maps.test/x",
        referencia: "Junto al parque",
        latitud: -2.17,
        longitud: -79.92,
        validarAforo: true,
        maxCapacidad: 20,
        imagenPortada: "https://cdn.test/portada.jpg",
        imagenesGaleria: ["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"],
        modoConfirmacion: "inmediata",
      },
      TOKEN,
    );
    expect(destino).toBe("/espacios");
  });

  /** Enviar `0` en una FK opcional crearía una referencia inválida en el backend. */
  it("omite las referencias opcionales que llegan vacías", async () => {
    await capturarRedirect(() =>
      actions.createEspacio(
        undefined,
        formData({ ...CAMPOS_COMPLETOS, provinciaId: "", ciudadId: "", latitud: "", longitud: "" }),
      ),
    );

    expect(api.createEspacio).toHaveBeenCalledWith(
      expect.objectContaining({
        provinciaId: undefined,
        ciudadId: undefined,
        latitud: undefined,
        longitud: undefined,
      }),
      TOKEN,
    );
  });

  it("interpreta el aforo como booleano, no como la cadena del formulario", async () => {
    await capturarRedirect(() =>
      actions.createEspacio(undefined, formData({ ...CAMPOS_COMPLETOS, validarAforo: "false" })),
    );

    expect(api.createEspacio).toHaveBeenCalledWith(
      expect.objectContaining({ validarAforo: false }),
      TOKEN,
    );
  });

  it("acepta una galería vacía sin romper el parseo", async () => {
    await capturarRedirect(() =>
      actions.createEspacio(undefined, formData({ ...CAMPOS_COMPLETOS, imagenesGaleria: "" })),
    );

    expect(api.createEspacio).toHaveBeenCalledWith(
      expect.objectContaining({ imagenesGaleria: [] }),
      TOKEN,
    );
  });

  it("omite el modo de confirmación cuando el formulario no lo trae", async () => {
    await capturarRedirect(() =>
      actions.createEspacio(undefined, formData({ ...CAMPOS_COMPLETOS, modoConfirmacion: "" })),
    );

    expect(api.createEspacio).toHaveBeenCalledWith(
      expect.objectContaining({ modoConfirmacion: undefined }),
      TOKEN,
    );
  });

  it("devuelve el mensaje del backend en vez de propagar el error", async () => {
    api.createEspacio.mockRejectedValue(new spacesApi.SpacesError("Ya tienes un espacio con ese nombre."));

    await expect(actions.createEspacio(undefined, formData(CAMPOS_COMPLETOS))).resolves.toEqual({
      error: "Ya tienes un espacio con ese nombre.",
    });
  });

  it("propaga los errores que no son del dominio de espacios", async () => {
    api.createEspacio.mockRejectedValue(new TypeError("fetch failed"));

    await expect(actions.createEspacio(undefined, formData(CAMPOS_COMPLETOS))).rejects.toThrow(
      "fetch failed",
    );
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(capturarRedirect(() => actions.createEspacio(undefined, formData(CAMPOS_COMPLETOS))))
      .resolves.toBe("/login");
    expect(api.createEspacio).not.toHaveBeenCalled();
  });
});

describe("updateEspacio", () => {
  it("envía el request completo con el id del espacio", async () => {
    const destino = await capturarRedirect(() =>
      actions.updateEspacio(7, formData(CAMPOS_COMPLETOS)),
    );

    expect(api.updateEspacio).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ titulo: "Cancha Norte", maxCapacidad: 20 }),
      TOKEN,
    );
    expect(destino).toBe("/espacios");
  });

  it("devuelve el mensaje del backend ante un fallo controlado", async () => {
    api.updateEspacio.mockRejectedValue(new spacesApi.SpacesError("El espacio tiene reservas activas."));

    await expect(actions.updateEspacio(7, formData(CAMPOS_COMPLETOS))).resolves.toEqual({
      error: "El espacio tiene reservas activas.",
    });
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(capturarRedirect(() => actions.updateEspacio(7, formData(CAMPOS_COMPLETOS))))
      .resolves.toBe("/login");
    expect(api.updateEspacio).not.toHaveBeenCalled();
  });
});

describe("activarEspacio", () => {
  /** El listado es una ruta de servidor: hay que revalidarla para ver el cambio. */
  it("activa y revalida el listado de espacios", async () => {
    api.activarEspacio.mockResolvedValue({ estado: "activo", tipoEspacioId: 3 } as never);

    await expect(actions.activarEspacio(7)).resolves.toBeUndefined();

    expect(api.activarEspacio).toHaveBeenCalledWith(7, TOKEN);
    expect(revalidar).toHaveBeenCalledWith("/espacios");
  });

  it("devuelve el motivo cuando el backend rechaza la activación", async () => {
    api.activarEspacio.mockRejectedValue(
      new spacesApi.SpacesError("Completa las tarifas antes de activar el espacio."),
    );

    await expect(actions.activarEspacio(7)).resolves.toEqual({
      error: "Completa las tarifas antes de activar el espacio.",
    });
    expect(revalidar).not.toHaveBeenCalled();
  });

  it("propaga los errores inesperados", async () => {
    api.activarEspacio.mockRejectedValue(new TypeError("fetch failed"));

    await expect(actions.activarEspacio(7)).rejects.toThrow("fetch failed");
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(capturarRedirect(() => actions.activarEspacio(7))).resolves.toBe("/login");
    expect(api.activarEspacio).not.toHaveBeenCalled();
  });
});

describe("inactivarEspacio", () => {
  it("inactiva y revalida el listado", async () => {
    api.inactivarEspacio.mockResolvedValue(undefined as never);

    await expect(actions.inactivarEspacio(7)).resolves.toBeUndefined();

    expect(api.inactivarEspacio).toHaveBeenCalledWith(7, TOKEN);
    expect(revalidar).toHaveBeenCalledWith("/espacios");
  });

  it("devuelve el motivo cuando el backend lo impide", async () => {
    api.inactivarEspacio.mockRejectedValue(
      new spacesApi.SpacesError("El espacio tiene reservas confirmadas."),
    );

    await expect(actions.inactivarEspacio(7)).resolves.toEqual({
      error: "El espacio tiene reservas confirmadas.",
    });
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(capturarRedirect(() => actions.inactivarEspacio(7))).resolves.toBe("/login");
    expect(api.inactivarEspacio).not.toHaveBeenCalled();
  });
});
