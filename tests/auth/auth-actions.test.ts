/**
 * Server Actions de autenticación (`lib/actions/auth.ts`).
 *
 * Se prueban como lo que son: **endpoints públicos**. Cada prueba entra por
 * `FormData` cruda —igual que lo haría una petición del navegador— y verifica
 * tres cosas: que la validación de servidor rechace la entrada inválida sin
 * llegar al backend, que un `AuthError` se convierta en mensaje para el usuario
 * en lugar de propagarse, y que la sesión solo se cree tras autenticar.
 *
 * `redirect()` de Next lanza internamente para cortar la ejecución; el doble lo
 * imita para poder afirmar el destino sin arrastrar el runtime del framework.
 */

class RedirectError extends Error {
  constructor(public readonly destino: string) {
    super(`NEXT_REDIRECT:${destino}`);
  }
}

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new RedirectError(destino);
  }),
}));

jest.mock("@/lib/auth/api", () => {
  class AuthError extends Error {}
  return {
    AuthError,
    login: jest.fn(),
    register: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
    googleAuthUrl: jest.fn(() => "https://backend.test/api/auth/google"),
    sendEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
    sendSmsOtp: jest.fn(),
    verifySmsOtp: jest.fn(),
  };
});

jest.mock("@/lib/auth/session", () => ({
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  getSessionTokens: jest.fn(),
}));

import * as authApi from "@/lib/auth/api";
import * as session from "@/lib/auth/session";
import * as actions from "@/lib/actions/auth";

const api = jest.mocked(authApi);
const sesion = jest.mocked(session);

const TOKENS = { accessToken: "header.payload.sign", refreshToken: "refresh-1" };

function formData(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

/** Ejecuta una action que debe terminar redirigiendo y devuelve el destino. */
async function capturarRedirect(ejecutar: () => Promise<unknown>): Promise<string> {
  try {
    await ejecutar();
  } catch (error) {
    if (error instanceof RedirectError) return error.destino;
    throw error;
  }
  throw new Error("Se esperaba un redirect y la action terminó sin redirigir.");
}

beforeEach(() => {
  // Silencia el log de diagnóstico de claims que hace `login` en éxito.
  jest.spyOn(console, "log").mockImplementation(() => {});
});

describe("login", () => {
  it("no llama al backend si el correo es inválido", async () => {
    const state = await actions.login(undefined, formData({ email: "roto", password: "x" }));

    expect(state?.errors?.email?.[0]).toBe("Ingresa un correo válido.");
    expect(api.login).not.toHaveBeenCalled();
    expect(sesion.createSession).not.toHaveBeenCalled();
  });

  it("devuelve error de campo cuando falta la contraseña", async () => {
    const state = await actions.login(undefined, formData({ email: "ana@example.com", password: "" }));

    expect(state?.errors?.password?.[0]).toBe("La contraseña es obligatoria.");
    expect(api.login).not.toHaveBeenCalled();
  });

  it("crea la sesión y lleva al onboarding cuando las credenciales son válidas", async () => {
    api.login.mockResolvedValue(TOKENS);

    const destino = await capturarRedirect(() =>
      actions.login(undefined, formData({ email: "ana@example.com", password: "secreta123" })),
    );

    expect(api.login).toHaveBeenCalledWith("ana@example.com", "secreta123");
    expect(sesion.createSession).toHaveBeenCalledWith(TOKENS);
    expect(destino).toBe("/onboarding");
  });

  /** Credenciales incorrectas son un caso esperado, no una excepción sin manejar. */
  it("convierte un AuthError en mensaje para el usuario, sin crear sesión", async () => {
    api.login.mockRejectedValue(new authApi.AuthError("Correo o contraseña incorrectos."));

    const state = await actions.login(
      undefined,
      formData({ email: "ana@example.com", password: "mala" }),
    );

    expect(state?.message).toBe("Correo o contraseña incorrectos.");
    expect(sesion.createSession).not.toHaveBeenCalled();
  });

  it("propaga los errores que no son de autenticación", async () => {
    api.login.mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      actions.login(undefined, formData({ email: "ana@example.com", password: "secreta123" })),
    ).rejects.toThrow("fetch failed");
  });
});

describe("signup", () => {
  const registro = {
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@example.com",
    password: "secreta123",
    terms: "on",
  };

  it("registra, crea sesión y manda al onboarding", async () => {
    api.register.mockResolvedValue(TOKENS);

    const destino = await capturarRedirect(() => actions.signup(undefined, formData(registro)));

    expect(api.register).toHaveBeenCalledWith("Ana", "Pérez", "ana@example.com", "secreta123");
    expect(sesion.createSession).toHaveBeenCalledWith(TOKENS);
    expect(destino).toBe("/onboarding");
  });

  it("bloquea el registro si no se aceptaron las políticas de privacidad", async () => {
    // Sin la casilla marcada, el navegador no incluye `terms` en el FormData.
    const sinTerminos = { ...registro };
    delete (sinTerminos as Partial<typeof registro>).terms;

    const state = await actions.signup(undefined, formData(sinTerminos));

    expect(state?.errors?.terms?.[0]).toContain("Debes aceptar las políticas de privacidad");
    expect(api.register).not.toHaveBeenCalled();
  });

  /** El formulario se repuebla tras un error para no obligar a reescribirlo todo. */
  it("devuelve los valores ya escritos junto con los errores de validación", async () => {
    const state = await actions.signup(
      undefined,
      formData({ ...registro, password: "corta" }),
    );

    expect(state?.errors?.password?.length).toBeGreaterThan(0);
    expect(state?.values).toEqual({
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.com",
    });
  });

  it("nunca devuelve la contraseña entre los valores repoblados", async () => {
    const state = await actions.signup(undefined, formData({ ...registro, email: "roto" }));

    expect(state?.values).not.toHaveProperty("password");
    expect(JSON.stringify(state)).not.toContain("secreta123");
  });

  it("muestra el mensaje del backend cuando el correo ya existe", async () => {
    api.register.mockRejectedValue(new authApi.AuthError("Ya existe una cuenta con este correo."));

    const state = await actions.signup(undefined, formData(registro));

    expect(state?.message).toBe("Ya existe una cuenta con este correo.");
    expect(state?.values?.email).toBe("ana@example.com");
    expect(sesion.createSession).not.toHaveBeenCalled();
  });
});

describe("forgotPassword", () => {
  it("redirige con ?sent=1 sin revelar si la cuenta existe", async () => {
    api.forgotPassword.mockResolvedValue(undefined);

    const destino = await capturarRedirect(() =>
      actions.forgotPassword(undefined, formData({ email: "ana@example.com" })),
    );

    expect(destino).toBe("/forgot-password?sent=1");
  });

  it("valida el correo antes de llamar al backend", async () => {
    const state = await actions.forgotPassword(undefined, formData({ email: "roto" }));

    expect(state?.errors?.email?.[0]).toBe("Ingresa un correo válido.");
    expect(api.forgotPassword).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  const enlaceValido = {
    email: "ana@example.com",
    token: "tok-123",
    password: "secreta123",
    confirmPassword: "secreta123",
  };

  it("aplica la contraseña y devuelve al login", async () => {
    api.resetPassword.mockResolvedValue(undefined);

    const destino = await capturarRedirect(() =>
      actions.resetPassword(undefined, formData(enlaceValido)),
    );

    expect(api.resetPassword).toHaveBeenCalledWith("ana@example.com", "tok-123", "secreta123");
    expect(destino).toBe("/login?reset=success");
  });

  /**
   * `email` y `token` viajan ocultos: si fallan, el usuario no puede corregirlos,
   * así que se reporta como enlace inválido en vez de como error de un campo.
   */
  it("trata un token ausente como enlace inválido, no como error de campo", async () => {
    const state = await actions.resetPassword(
      undefined,
      formData({ ...enlaceValido, token: "" }),
    );

    expect(state?.message).toBe("El enlace no es válido o expiró. Solicita uno nuevo.");
    expect(state?.errors).toBeUndefined();
    expect(api.resetPassword).not.toHaveBeenCalled();
  });

  it("reporta la falta de coincidencia como error del campo de confirmación", async () => {
    const state = await actions.resetPassword(
      undefined,
      formData({ ...enlaceValido, confirmPassword: "otra12345" }),
    );

    expect(state?.errors?.confirmPassword?.[0]).toBe("Las contraseñas no coinciden.");
    expect(state?.message).toBeUndefined();
  });

  it("muestra el mensaje del backend si el token ya fue consumido", async () => {
    api.resetPassword.mockRejectedValue(new authApi.AuthError("El enlace ya fue utilizado."));

    const state = await actions.resetPassword(undefined, formData(enlaceValido));

    expect(state?.message).toBe("El enlace ya fue utilizado.");
  });
});

describe("loginWithGoogle", () => {
  it("delega la construcción del state anti-CSRF al backend", async () => {
    const destino = await capturarRedirect(() => actions.loginWithGoogle());

    expect(destino).toBe("https://backend.test/api/auth/google");
    expect(api.googleAuthUrl).toHaveBeenCalled();
  });
});

describe("verificación OTP", () => {
  it("sendEmailOtp devuelve éxito cuando el backend acepta", async () => {
    api.sendEmailOtp.mockResolvedValue(undefined);
    await expect(actions.sendEmailOtp("ana@example.com")).resolves.toEqual({ success: true });
  });

  it("verifyEmailOtp devuelve el mensaje de error del backend", async () => {
    api.verifyEmailOtp.mockRejectedValue(new authApi.AuthError("Código incorrecto."));

    await expect(actions.verifyEmailOtp("ana@example.com", "000000")).resolves.toEqual({
      success: false,
      message: "Código incorrecto.",
    });
  });

  /** El OTP por SMS va autenticado: sin sesión no debe siquiera intentarse. */
  it("sendSmsOtp exige sesión activa y no llama al backend sin ella", async () => {
    sesion.getSessionTokens.mockResolvedValue(null);

    await expect(actions.sendSmsOtp("0999999999")).resolves.toEqual({
      success: false,
      message: "Tu sesión expiró. Inicia sesión de nuevo.",
    });
    expect(api.sendSmsOtp).not.toHaveBeenCalled();
  });

  it("sendSmsOtp usa el access token de la sesión, no un parámetro del cliente", async () => {
    sesion.getSessionTokens.mockResolvedValue(TOKENS);
    api.sendSmsOtp.mockResolvedValue(undefined);

    await expect(actions.sendSmsOtp("0999999999")).resolves.toEqual({ success: true });
    expect(api.sendSmsOtp).toHaveBeenCalledWith("0999999999", TOKENS.accessToken);
  });

  it("verifySmsOtp exige sesión activa", async () => {
    sesion.getSessionTokens.mockResolvedValue(null);

    await expect(actions.verifySmsOtp("123456")).resolves.toEqual({
      success: false,
      message: "Tu sesión expiró. Inicia sesión de nuevo.",
    });
    expect(api.verifySmsOtp).not.toHaveBeenCalled();
  });

  it("verifySmsOtp confirma el código con el token de sesión", async () => {
    sesion.getSessionTokens.mockResolvedValue(TOKENS);
    api.verifySmsOtp.mockResolvedValue(undefined);

    await expect(actions.verifySmsOtp("123456")).resolves.toEqual({ success: true });
    expect(api.verifySmsOtp).toHaveBeenCalledWith("123456", TOKENS.accessToken);
  });
});

describe("logout", () => {
  /** Cerrar sesión debe revocar el refresh en el backend, no solo borrar la cookie. */
  it("revoca el refresh token, borra la cookie y vuelve al login", async () => {
    sesion.getSessionTokens.mockResolvedValue(TOKENS);

    const destino = await capturarRedirect(() => actions.logout());

    expect(api.logout).toHaveBeenCalledWith(TOKENS.refreshToken);
    expect(sesion.deleteSession).toHaveBeenCalled();
    expect(destino).toBe("/login");
  });

  it("borra la cookie igual si ya no había sesión que revocar", async () => {
    sesion.getSessionTokens.mockResolvedValue(null);

    const destino = await capturarRedirect(() => actions.logout());

    expect(api.logout).not.toHaveBeenCalled();
    expect(sesion.deleteSession).toHaveBeenCalled();
    expect(destino).toBe("/login");
  });
});
