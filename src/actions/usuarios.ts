"use server";

import * as usuariosApi from "@/lib/usuarios-api";

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
