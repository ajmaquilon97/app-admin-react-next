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

export type AvailabilityResult = {
  emailInUse: boolean;
  phoneInUse: boolean;
};

/**
 * POST /api/usuarios/check-availability — endpoint público, sin auth.
 * Manda solo el campo que se quiere validar; el otro se omite.
 */
export async function checkAvailability(params: {
  email?: string;
  phoneNumber?: string;
}): Promise<AvailabilityResult> {
  const res = await fetch(apiUrl("/api/usuarios/check-availability"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: params.email ?? null, phoneNumber: params.phoneNumber ?? null }),
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[usuarios-api] POST /api/usuarios/check-availability ${res.status} →`, raw);

  if (!res.ok) {
    throw new UsuariosError("No se pudo verificar la disponibilidad.");
  }
  return raw ? (JSON.parse(raw) as AvailabilityResult) : { emailInUse: false, phoneInUse: false };
}

export type CompletarPerfilInput = {
  /** Se omite en actualizaciones desde Configuración para no tocar el rol; el onboarding sí lo fija. */
  tipoUsuarioId?: number;
  nombre?: string;
  apellido?: string;
  numeroCedula?: string;
  fechaNacimiento?: string;
  rutaFotoCedula?: string;
  fotoPerfilUrl?: string;
  /** FK a GET /api/catalogos/ubicaciones. Si se envía `ciudadId`, requiere `provinciaId` y debe pertenecerle. */
  provinciaId?: number;
  ciudadId?: number;
};

export type UsuarioResponse = {
  id: string;
  [key: string]: unknown;
};

/** GET /api/usuarios/{id} — shape completo según `UsuarioResponse` del swagger. */
export type UsuarioDetalle = {
  id: string | null;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  fechaNacimiento: string | null;
  numeroCedula: string | null;
  rutaFotoCedula: string | null;
  fotoPerfilUrl: string | null;
  provinciaId: number | null;
  ciudadId: number | null;
  tipoUsuarioId: number;
  tipoUsuarioNombre: string | null;
  username: string | null;
  fechaCreacion: string;
};

/** GET /api/usuarios/{id} — datos completos del usuario. Requiere JWT del propio usuario. */
export async function getUsuario(id: string, accessToken: string): Promise<UsuarioDetalle> {
  const tag = `GET /api/usuarios/${id}`;
  const res = await fetch(apiUrl(`/api/usuarios/${id}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[usuarios-api] ${tag} ${res.status} →`, raw);

  if (!res.ok) {
    throw new UsuariosError("No se pudo obtener el perfil del usuario.");
  }
  return JSON.parse(raw) as UsuarioDetalle;
}

/**
 * PUT /api/usuarios/{id} — Completa/actualiza el perfil del usuario autenticado
 * (Fase 2 del onboarding, y también usado por la pantalla de Configuración > Perfil).
 * `id` debe coincidir con el claim `sub` del JWT. En el onboarding, `tipoUsuarioId` se
 * envía hardcodeado en `2` (Propietario, ver `register()` en auth-api.ts); en Configuración
 * se omite para no tocar el rol ya asignado.
 */
export async function completeProfile(
  id: string,
  accessToken: string,
  input: CompletarPerfilInput,
): Promise<UsuarioResponse> {
  const tag = `PUT /api/usuarios/${id}`;
  const res = await fetch(apiUrl(`/api/usuarios/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const raw = await res.text();
  console.log(`[usuarios-api] ${tag} ${res.status} →`, raw);

  if (!res.ok) {
    let msg: string | undefined;
    try {
      msg = raw ? (JSON.parse(raw) as { message?: string }).message : undefined;
    } catch {
      // body no-JSON
    }
    throw new UsuariosError(msg ?? "No se pudo completar el perfil.");
  }

  return JSON.parse(raw) as UsuarioResponse;
}

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
