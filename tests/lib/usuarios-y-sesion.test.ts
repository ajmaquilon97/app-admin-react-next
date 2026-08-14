/**
 * Capa transversal: verificación de disponibilidad de credenciales, cierre del
 * onboarding, sesión sobre cookie cifrada y catálogo compartido de espacios.
 *
 * El criterio que atraviesa todo el archivo es el de AGENTS.md sobre `lib/`:
 * cada export de un archivo `"use server"` es un endpoint alcanzable desde el
 * navegador, así que ninguno recibe el token como parámetro — lo resuelven
 * desde la cookie.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/lib/api/usuarios", () => {
  class UsuariosError extends Error {}
  return {
    UsuariosError,
    checkAvailability: jest.fn(),
    completeProfile: jest.fn(),
    getUsuario: jest.fn(),
  };
});
jest.mock("@/lib/api/espacios-catalogo", () => ({ loadEspacioOptions: jest.fn() }));

import * as usuariosApi from "@/lib/api/usuarios";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import * as usuariosActions from "@/lib/actions/usuarios";
import { getSpaceOptions } from "@/lib/actions/catalogo-espacios";
import { espacioOption } from "../helpers/fixtures";

const api = jest.mocked(usuariosApi);
const sesion = jest.mocked(getSessionTokens);
const catalogo = jest.mocked(loadEspacioOptions);
const TOKEN = "tok";

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
});

describe("checkEmailAvailability", () => {
  it("traduce emailInUse a disponibilidad", async () => {
    api.checkAvailability.mockResolvedValue({ emailInUse: true, phoneInUse: false } as never);

    await expect(usuariosActions.checkEmailAvailability("ana@example.com")).resolves.toEqual({
      available: false,
    });
    expect(api.checkAvailability).toHaveBeenCalledWith({ email: "ana@example.com" });
  });

  it("reporta disponible cuando el correo no está en uso", async () => {
    api.checkAvailability.mockResolvedValue({ emailInUse: false, phoneInUse: false } as never);

    await expect(usuariosActions.checkEmailAvailability("nueva@example.com")).resolves.toEqual({
      available: true,
    });
  });

  it.each([["", "vacío"], ["   ", "solo espacios"]])(
    "no consulta el backend con un correo %s",
    async (email) => {
      await expect(usuariosActions.checkEmailAvailability(email)).resolves.toEqual({
        available: true,
      });
      expect(api.checkAvailability).not.toHaveBeenCalled();
    },
  );

  /**
   * Esta verificación es solo una ayuda temprana: si falla no debe impedir
   * enviar el formulario, porque el backend valida igual al registrar.
   */
  it("no bloquea al usuario si la verificación falla", async () => {
    api.checkAvailability.mockRejectedValue(new Error("timeout"));

    await expect(usuariosActions.checkEmailAvailability("ana@example.com")).resolves.toEqual({
      available: true,
    });
  });
});

describe("checkPhoneAvailability", () => {
  it("traduce phoneInUse a disponibilidad", async () => {
    api.checkAvailability.mockResolvedValue({ emailInUse: false, phoneInUse: true } as never);

    await expect(usuariosActions.checkPhoneAvailability("0999999999")).resolves.toEqual({
      available: false,
    });
    expect(api.checkAvailability).toHaveBeenCalledWith({ phoneNumber: "0999999999" });
  });

  it("no consulta con un teléfono vacío", async () => {
    await expect(usuariosActions.checkPhoneAvailability("  ")).resolves.toEqual({ available: true });
    expect(api.checkAvailability).not.toHaveBeenCalled();
  });

  it("degrada a disponible ante un fallo de red", async () => {
    api.checkAvailability.mockRejectedValue(new Error("timeout"));

    await expect(usuariosActions.checkPhoneAvailability("0999999999")).resolves.toEqual({
      available: true,
    });
  });
});

describe("completeOnboardingProfile", () => {
  const datos = {
    nombre: "Ana",
    apellido: "Pérez",
    numeroCedula: "0912345678",
    fechaNacimiento: "1995-04-02",
  };

  it("cierra el onboarding con el tipo de usuario anfitrión", async () => {
    await expect(usuariosActions.completeOnboardingProfile("u1", datos)).resolves.toEqual({
      success: true,
    });

    expect(api.completeProfile).toHaveBeenCalledWith("u1", TOKEN, {
      tipoUsuarioId: 2,
      nombre: "Ana",
      apellido: "Pérez",
      numeroCedula: "0912345678",
      fechaNacimiento: "1995-04-02",
      rutaFotoCedula: "",
    });
  });

  /**
   * Los datos fiscales del negocio (RUC, razón social) se gestionan aparte en
   * Configuración > Negocio: no deben colarse en el cierre del onboarding.
   */
  it("no envía datos fiscales del negocio", async () => {
    await usuariosActions.completeOnboardingProfile("u1", datos);

    const enviado = api.completeProfile.mock.calls[0]![2];
    expect(enviado).not.toHaveProperty("ruc");
    expect(enviado).not.toHaveProperty("razonSocial");
  });

  it("devuelve un mensaje accionable si la sesión expiró", async () => {
    sesion.mockResolvedValue(null);

    await expect(usuariosActions.completeOnboardingProfile("u1", datos)).resolves.toEqual({
      success: false,
      message: "Tu sesión expiró. Inicia sesión de nuevo.",
    });
    expect(api.completeProfile).not.toHaveBeenCalled();
  });

  it("devuelve el mensaje del backend ante un fallo controlado", async () => {
    api.completeProfile.mockRejectedValue(new usuariosApi.UsuariosError("Cédula ya registrada."));

    await expect(usuariosActions.completeOnboardingProfile("u1", datos)).resolves.toEqual({
      success: false,
      message: "Cédula ya registrada.",
    });
  });

  it("propaga los errores inesperados", async () => {
    api.completeProfile.mockRejectedValue(new TypeError("fetch failed"));

    await expect(usuariosActions.completeOnboardingProfile("u1", datos)).rejects.toThrow(
      "fetch failed",
    );
  });
});

describe("getSpaceOptions", () => {
  it("resuelve la sesión y delega en el cargador server-only", async () => {
    catalogo.mockResolvedValue([espacioOption()]);

    await expect(getSpaceOptions()).resolves.toHaveLength(1);
    expect(catalogo).toHaveBeenCalledWith(TOKEN);
  });

  /**
   * Este export es alcanzable desde el navegador: no acepta el token como
   * argumento, lo lee de la cookie cifrada. La versión que sí lo recibe es
   * `loadEspacioOptions`, que es `server-only`.
   */
  it("no acepta credenciales como argumento", () => {
    expect(getSpaceOptions.length).toBe(0);
  });

  it("redirige al login sin sesión", async () => {
    sesion.mockResolvedValue(null);

    await expect(getSpaceOptions()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(catalogo).not.toHaveBeenCalled();
  });
});
