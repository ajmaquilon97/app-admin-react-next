"use server";

import * as usuariosApi from "@/lib/usuarios-api";
import { getSessionTokens } from "@/lib/session";

export type AvailabilityCheck = { available: boolean };

export async function checkEmailAvailability(email: string): Promise<AvailabilityCheck> {
  if (!email.trim()) return { available: true };
  try {
    const result = await usuariosApi.checkAvailability({ email });
    return { available: !result.emailInUse };
  } catch {
    // Si la verificación falla, no bloqueamos al usuario — el backend valida igual al enviar el formulario.
    return { available: true };
  }
}

export async function checkPhoneAvailability(phoneNumber: string): Promise<AvailabilityCheck> {
  if (!phoneNumber.trim()) return { available: true };
  try {
    const result = await usuariosApi.checkAvailability({ phoneNumber });
    return { available: !result.phoneInUse };
  } catch {
    return { available: true };
  }
}

export type CompleteProfileResult =
  | { success: true }
  | { success: false; message: string };

/** Último paso del onboarding — PUT /api/usuarios/{id} con los datos del formulario de perfil. */
export async function completeOnboardingProfile(
  userId: string,
  data: { numeroCedula: string; fechaNacimiento: string },
): Promise<CompleteProfileResult> {
  const tokens = await getSessionTokens();
  if (!tokens) {
    return { success: false, message: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  try {
    await usuariosApi.completeProfile(userId, tokens.accessToken, {
      numeroCedula: data.numeroCedula,
      fechaNacimiento: data.fechaNacimiento,
      rutaFotoCedula: "",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof usuariosApi.UsuariosError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}
