import "server-only";
import type { TokenPair } from "@/lib/definitions";

/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  Cliente del backend de auth (ApiTesis / ASP.NET Core Identity).     ║
 * ║                                                                      ║
 * ║  Cada función envuelve un endpoint del backend y mantiene la FIRMA   ║
 * ║  pública estable: el resto de la app (session, dal, proxy, acciones) ║
 * ║  solo conoce `TokenPair` y `AuthError`, nunca el detalle HTTP.       ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

const API_BASE_URL = process.env.API_BASE_URL;

/** Error de auth con mensaje seguro para mostrar al usuario. */
export class AuthError extends Error {}

function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL no está configurada. Define la variable de entorno.",
    );
  }
  return `${API_BASE_URL}${path}`;
}

type BackendError = { message?: string; errors?: Record<string, string[]> };

/** Intenta extraer el `message` del cuerpo de error `{ message, errors? }`. */
async function readMessage(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as BackendError;
    return body?.message;
  } catch {
    return undefined;
  }
}

/** POST /api/auth/login — valida credenciales y devuelve el par de tokens. */
export async function login(
  email: string,
  password: string,
): Promise<TokenPair> {
  const res = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // El backend espera los campos en español (LoginRequest).
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new AuthError("Correo o contraseña incorrectos.");
  }
  if (!res.ok) {
    throw new AuthError((await readMessage(res)) ?? "No se pudo iniciar sesión.");
  }
  return (await res.json()) as TokenPair;
}

/**
 * POST /api/usuarios — Registro local (Fase 1). Crea la cuenta y auto-login.
 *
 * El backend exige `username` y `tipoUsuarioId` que el formulario no recolecta:
 *  - `username` se deriva del correo (parte antes de `@`), como acuerda el spec.
 *  - `tipoUsuarioId = 1` (Anfitrión/Propietario) es el rol por defecto.
 */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<TokenPair> {
  const username = email;
  console.log("Ingresa a validar usuario");
  const res = await fetch(apiUrl("/api/usuarios"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: name,
      email,
      username,
      password,
      tipoUsuarioId: 1,
    }),
    cache: "no-store",
  });

  if (res.status === 409) {
    throw new AuthError(
      (await readMessage(res)) ?? "Ya existe una cuenta con este correo.",
    );
  }
  if (!res.ok) {
    throw new AuthError((await readMessage(res)) ?? "No se pudo crear la cuenta.");
  }

  // El backend devuelve { id, accessToken, refreshToken }; el `id` también viaja
  // en el claim `sub`, así que solo propagamos el par de tokens.
  const data = (await res.json()) as TokenPair & { id?: string };
  console.log("Data from response: ", data);
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

/** POST /api/auth/refresh — rota el par de tokens a partir de un refresh válido. */
export async function refresh(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new AuthError("Sesión expirada. Inicia sesión de nuevo.");
  }
  return (await res.json()) as TokenPair;
}

/**
 * POST /api/auth/logout — revoca el refresh token en el backend.
 * No lanza: el cierre de sesión local debe proceder aunque el backend falle.
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // Best-effort: si el backend no responde, igual borramos la cookie local.
  }
}

/** URL del backend que inicia el consentimiento de Google (ida del OAuth). */
export function googleAuthUrl(): string {
  return apiUrl("/api/auth/google");
}

/**
 * POST /api/auth/google/exchange — canjea el código de un solo uso (60 s) que el
 * backend adjunta al redirigir de vuelta, por el par definitivo de tokens.
 * Solo se llama server-to-server desde el callback (nunca desde el navegador).
 */
export async function exchangeGoogleCode(code: string): Promise<TokenPair> {
  const res = await fetch(apiUrl("/api/auth/google/exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new AuthError("No se pudo completar el inicio con Google.");
  }
  return (await res.json()) as TokenPair;
}
