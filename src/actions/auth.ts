"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  LoginSchema,
  SignupSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type AuthFormState,
  type ForgotPasswordFormState,
  type ResetPasswordFormState,
} from "@/lib/definitions";
import * as authApi from "@/lib/auth-api";
import { createSession, deleteSession, getSessionTokens } from "@/lib/session";

/**
 * Server Actions de autenticación. Tratar como endpoints públicos:
 * toda validación ocurre en el servidor. `redirect()` se llama FUERA del
 * try/catch porque internamente lanza (no debe ser atrapado).
 */

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const tokens = await authApi.login(parsed.data.email, parsed.data.password);
    await createSession(tokens);
    // DEBUG — quitar antes de producción
    try {
      const payload = JSON.parse(Buffer.from(tokens.accessToken.split(".")[1]!, "base64").toString());
      console.log("[auth] login exitoso — claims JWT:", payload);
    } catch {
      console.log("[auth] login exitoso — token:", tokens.accessToken);
    }
  } catch (error) {
    if (error instanceof authApi.AuthError) return { message: error.message };
    throw error;
  }

  // La página de onboarding decide si el usuario ya completó todo (lo manda
  // a /dashboard) o en qué paso debe continuar — no lo decidimos aquí para no
  // duplicar esa lógica en cada punto de entrada (login, Google, signup).
  redirect("/onboarding");
}

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    terms: formData.get("terms") === "on",
  };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error).fieldErrors,
      values: { firstName: raw.firstName, lastName: raw.lastName, email: raw.email },
    };
  }

  try {
    const { firstName, lastName, email, password } = parsed.data;
    const tokens = await authApi.register(firstName, lastName, email, password);
    await createSession(tokens);
  } catch (error) {
    if (error instanceof authApi.AuthError) {
      return {
        message: error.message,
        values: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email },
      };
    }
    throw error;
  }

  // Cuentas nuevas pasan por el asistente de onboarding antes del portal.
  redirect("/onboarding");
}

/**
 * Solicita el envío del correo de recuperación de contraseña. Por diseño
 * (evitar enumeración de cuentas) siempre termina en el mismo mensaje
 * genérico, sin importar si el correo existe — así que en éxito simplemente
 * redirige a la misma página con `?sent=1`, que es quien decide qué mostrar.
 */
export async function forgotPassword(
  _state: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await authApi.forgotPassword(parsed.data.email);
  } catch (error) {
    if (error instanceof authApi.AuthError) return { message: error.message };
    throw error;
  }

  redirect("/forgot-password?sent=1");
}

/**
 * Aplica la nueva contraseña a partir del token del enlace de recuperación.
 * `email`/`token` viajan como campos ocultos (la página ya validó que vengan
 * en la URL antes de renderizar el formulario) — si de todos modos fallan la
 * validación (enlace manipulado), se trata como enlace inválido, no como
 * error de un campo visible.
 */
export async function resetPassword(
  _state: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { email, token, ...fieldErrors } = z.flattenError(parsed.error).fieldErrors;
    if (email || token) {
      return { message: "El enlace no es válido o expiró. Solicita uno nuevo." };
    }
    return { errors: fieldErrors };
  }

  try {
    await authApi.resetPassword(parsed.data.email, parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof authApi.AuthError) return { message: error.message };
    throw error;
  }

  redirect("/login?reset=success");
}

/**
 * Inicio de sesión con Google (OAuth dirigido por el backend).
 *
 * Solo dispara la IDA: redirige al endpoint del backend que construye el `state`
 * anti-CSRF y manda al usuario a Google. La VUELTA la maneja el route handler
 * `app/auth/google/callback`, que canjea el código y crea la sesión.
 */
export async function loginWithGoogle(): Promise<void> {
  redirect(authApi.googleAuthUrl());
}

export type OtpActionResult = { success: true } | { success: false; message: string };

export async function sendEmailOtp(email: string): Promise<OtpActionResult> {
  try {
    await authApi.sendEmailOtp(email);
    return { success: true };
  } catch (error) {
    if (error instanceof authApi.AuthError) return { success: false, message: error.message };
    throw error;
  }
}

export async function verifyEmailOtp(email: string, code: string): Promise<OtpActionResult> {
  try {
    await authApi.verifyEmailOtp(email, code);
    return { success: true };
  } catch (error) {
    if (error instanceof authApi.AuthError) return { success: false, message: error.message };
    throw error;
  }
}

export async function sendSmsOtp(phoneNumber: string): Promise<OtpActionResult> {
  const tokens = await getSessionTokens();
  if (!tokens) return { success: false, message: "Tu sesión expiró. Inicia sesión de nuevo." };
  try {
    await authApi.sendSmsOtp(phoneNumber, tokens.accessToken);
    return { success: true };
  } catch (error) {
    if (error instanceof authApi.AuthError) return { success: false, message: error.message };
    throw error;
  }
}

export async function verifySmsOtp(code: string): Promise<OtpActionResult> {
  const tokens = await getSessionTokens();
  if (!tokens) return { success: false, message: "Tu sesión expiró. Inicia sesión de nuevo." };
  try {
    await authApi.verifySmsOtp(code, tokens.accessToken);
    return { success: true };
  } catch (error) {
    if (error instanceof authApi.AuthError) return { success: false, message: error.message };
    throw error;
  }
}

export async function logout(): Promise<void> {
  // Revoca el refresh en el backend antes de borrar la cookie local.
  const tokens = await getSessionTokens();
  if (tokens) {
    await authApi.logout(tokens.refreshToken);
  }
  await deleteSession();
  redirect("/login");
}
