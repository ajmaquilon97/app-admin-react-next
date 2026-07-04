"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  LoginSchema,
  SignupSchema,
  type AuthFormState,
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
  } catch (error) {
    if (error instanceof authApi.AuthError) return { message: error.message };
    throw error;
  }

  redirect("/dashboard");
}

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    terms: formData.get("terms") === "on",
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const { name, email, password } = parsed.data;
    const tokens = await authApi.register(name, email, password);
    await createSession(tokens);
  } catch (error) {
    if (error instanceof authApi.AuthError) return { message: error.message };
    throw error;
  }

  // Cuentas nuevas pasan por el asistente de onboarding antes del portal.
  redirect("/onboarding");
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

export async function logout(): Promise<void> {
  // Revoca el refresh en el backend antes de borrar la cookie local.
  const tokens = await getSessionTokens();
  if (tokens) {
    await authApi.logout(tokens.refreshToken);
  }
  await deleteSession();
  redirect("/login");
}
