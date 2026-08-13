/**
 * Sesión sobre la cookie `httpOnly` cifrada (`lib/auth/session.ts`).
 *
 * Vive en su propio archivo porque el resto de la suite sustituye este módulo
 * por un doble; aquí se ejercita el real, con `next/headers` como única
 * frontera simulada. Lo que se comprueba es el contrato de seguridad: la cookie
 * es httpOnly, su contenido es un JWE (los tokens del backend nunca viajan
 * legibles al navegador) y cualquier cookie manipulada degrada a `null`.
 */

jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { createSession, getSessionTokens, deleteSession } from "@/lib/auth/session";

const TOKENS = { accessToken: "access-abc", refreshToken: "refresh-xyz" };

type CookieStoreDoble = {
  get: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
};

let store: CookieStoreDoble;

beforeEach(() => {
  store = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
  jest.mocked(cookies).mockResolvedValue(store as never);
});

describe("createSession", () => {
  it("escribe la cookie como httpOnly, sameSite lax y con caducidad", async () => {
    await createSession(TOKENS);

    expect(store.set).toHaveBeenCalledWith(
      "session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );

    const opciones = store.set.mock.calls[0]![2] as { expires: Date };
    expect(opciones.expires.getTime()).toBeGreaterThan(Date.now());
  });

  /** El navegador nunca debe poder leer el access token del backend. */
  it("guarda un JWE, no los tokens en claro", async () => {
    await createSession(TOKENS);

    const valor = store.set.mock.calls[0]![1] as string;
    expect(valor.split(".")).toHaveLength(5);
    expect(valor).not.toContain("access-abc");
    expect(valor).not.toContain("refresh-xyz");
  });
});

describe("getSessionTokens", () => {
  it("devuelve null si no hay cookie", async () => {
    store.get.mockReturnValue(undefined);

    await expect(getSessionTokens()).resolves.toBeNull();
  });

  it("descifra la cookie escrita por createSession", async () => {
    await createSession(TOKENS);
    const jwe = store.set.mock.calls[0]![1] as string;
    store.get.mockReturnValue({ value: jwe });

    await expect(getSessionTokens()).resolves.toEqual(TOKENS);
    expect(store.get).toHaveBeenCalledWith("session");
  });

  it("devuelve null ante una cookie falsificada", async () => {
    store.get.mockReturnValue({ value: "cookie-inventada" });

    await expect(getSessionTokens()).resolves.toBeNull();
  });

  it("devuelve null ante una cookie vacía", async () => {
    store.get.mockReturnValue({ value: "" });

    await expect(getSessionTokens()).resolves.toBeNull();
  });
});

describe("deleteSession", () => {
  it("borra la cookie de sesión", async () => {
    await deleteSession();

    expect(store.delete).toHaveBeenCalledWith("session");
  });
});
