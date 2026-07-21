import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export class UsuariosError extends Error {}

export type OnboardingStatus = {
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  isPersonalInfoComplete: boolean;
};

/** GET /api/usuarios/me/onboarding-status — progreso del onboarding del usuario autenticado. */
export async function getOnboardingStatus(accessToken: string): Promise<OnboardingStatus> {
  const res = await fetch(apiUrl("/api/usuarios/me/onboarding-status"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[usuarios-api] GET /api/usuarios/me/onboarding-status ${res.status} →`, raw);

  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
    } catch {
      // body no-JSON
    }
    throw new UsuariosError(msg ?? "No se pudo verificar el estado de onboarding.");
  }

  return JSON.parse(raw) as OnboardingStatus;
}
