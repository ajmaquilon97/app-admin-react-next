import "server-only";
import type { TokenPair } from "@/lib/auth/definitions";

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

/** Intenta extraer el `message` del cuerpo de error `{ message, errors? }`, logueando el body crudo. */
async function readMessage(res: Response, tag: string): Promise<string | undefined> {
  const raw = await res.text();
  console.log(`[auth-api] ${tag} ERROR ${res.status} →`, raw);
  try {
    return raw ? (JSON.parse(raw) as BackendError).message : undefined;
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
    await readMessage(res, "POST /api/auth/login");
    throw new AuthError("Correo o contraseña incorrectos.");
  }
  if (!res.ok) {
    throw new AuthError((await readMessage(res, "POST /api/auth/login")) ?? "No se pudo iniciar sesión.");
  }
  return (await res.json()) as TokenPair;
}

/**
 * POST /api/auth/register — Registro local del frontend Web/Anfitriones (Fase 1).
 * Crea la cuenta y auto-login. Siempre queda como Propietario (TipoUsuarioId=2) —
 * el backend no acepta elegir el tipo desde este endpoint, así que ya no se envía.
 * Web y Mobile son espacios de identidad separados: el mismo correo puede repetirse
 * con una cuenta Cliente creada desde la app mobile (`POST /api/mobile/auth/register`).
 *
 * `username` se deriva del correo (parte antes de `@`), como acuerda el spec.
 */
export async function register(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<TokenPair> {
  const username = email;
  const tag = "POST /api/auth/register";
  console.log(`[auth-api] ${tag} →`, { nombre: firstName, apellido: lastName, email, username });

  const res = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: firstName,
      apellido: lastName,
      email,
      username,
      password,
    }),
    cache: "no-store",
  });

  if (res.status === 409) {
    throw new AuthError(
      (await readMessage(res, tag)) ?? "Ya existe una cuenta con este correo.",
    );
  }
  if (!res.ok) {
    throw new AuthError((await readMessage(res, tag)) ?? "No se pudo crear la cuenta.");
  }

  // El backend devuelve { id, accessToken, refreshToken }; el `id` también viaja
  // en el claim `sub`, así que solo propagamos el par de tokens.
  const data = (await res.json()) as TokenPair & { id?: string };
  console.log(`[auth-api] ${tag} ${res.status} → { id: "${data.id}", accessToken: "(recibido)", refreshToken: "(recibido)" }`);
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

/** POST /api/auth/send-email-otp — genera y envía (por correo real) el código de verificación. */
export async function sendEmailOtp(email: string): Promise<void> {
  const tag = "POST /api/auth/send-email-otp";
  const res = await fetch(apiUrl("/api/auth/send-email-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AuthError((await readMessage(res, tag)) ?? "No se pudo enviar el código al correo.");
  }
}

/** POST /api/auth/verify-email-otp — valida el código y confirma el correo (EmailConfirmed). */
export async function verifyEmailOtp(email: string, code: string): Promise<void> {
  const tag = "POST /api/auth/verify-email-otp";
  const res = await fetch(apiUrl("/api/auth/verify-email-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AuthError((await readMessage(res, tag)) ?? "Código inválido o expirado.");
  }
}

/**
 * POST /api/auth/send-sms-otp — simula el envío de un OTP por SMS al usuario autenticado
 * (el código no llega por SMS real; el backend lo escribe en su consola). Requiere JWT.
 */
export async function sendSmsOtp(phoneNumber: string, accessToken: string): Promise<void> {
  const tag = "POST /api/auth/send-sms-otp";
  const res = await fetch(apiUrl("/api/auth/send-sms-otp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ phoneNumber }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AuthError((await readMessage(res, tag)) ?? "No se pudo enviar el código al teléfono.");
  }
}

/** POST /api/auth/verify-sms-otp — valida el OTP simulado (fijo: "123456") del usuario autenticado. */
export async function verifySmsOtp(code: string, accessToken: string): Promise<void> {
  const tag = "POST /api/auth/verify-sms-otp";
  const res = await fetch(apiUrl("/api/auth/verify-sms-otp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AuthError((await readMessage(res, tag)) ?? "Código inválido.");
  }
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

/**
 * POST /api/auth/forgot-password — inicia la recuperación de contraseña.
 * Debe responder 200 siempre (exista o no el correo) para no filtrar qué
 * correos están registrados; solo lanza si el backend realmente falló
 * (validación, rate-limit, 5xx).
 */
export async function forgotPassword(email: string): Promise<void> {
  const tag = "POST /api/auth/forgot-password";
  const res = await fetch(apiUrl("/api/auth/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AuthError(
      (await readMessage(res, tag)) ?? "No se pudo procesar la solicitud. Intenta de nuevo más tarde.",
    );
  }
}

/**
 * POST /api/auth/reset-password — aplica la nueva contraseña usando el token
 * de un solo uso que llegó por correo (ver `forgotPassword`).
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<void> {
  const tag = "POST /api/auth/reset-password";
  const res = await fetch(apiUrl("/api/auth/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, newPassword }),
    cache: "no-store",
  });
  if (!res.ok) {
    const status = res.status;
    const fallback =
      status === 400 || status === 410
        ? "El enlace no es válido o expiró. Solicita uno nuevo."
        : "No se pudo actualizar la contraseña.";
    throw new AuthError((await readMessage(res, tag)) ?? fallback);
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
    throw new AuthError(
      (await readMessage(res, "POST /api/auth/google/exchange")) ?? "No se pudo completar el inicio con Google.",
    );
  }
  return (await res.json()) as TokenPair;
}
