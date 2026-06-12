"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import {
  LoginSchema,
  SignupSchema,
  type AuthFormState,
} from "@/lib/definitions";
import * as authApi from "@/lib/auth-api";
import { createSession, deleteSession } from "@/lib/session";

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
 * Inicio de sesión con Google.
 *
 * FASE MOCK: crea la sesión directo con el usuario mock de Google y entra.
 *
 * REAL: reemplazar el cuerpo por  `redirect(<URL de Google / endpoint OAuth del
 * backend>)`. El backend hará el intercambio del `code` y el upsert; al volver,
 * un callback creará la sesión con `createSession(tokens)`. Mantener la firma.
 */
export async function loginWithGoogle(): Promise<void> {
  const tokens = await authApi.loginWithGoogle();
  await createSession(tokens);
  // Las cuentas federadas también completan el onboarding la primera vez.
  redirect("/onboarding");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
