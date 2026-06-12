import "server-only";
import { cache } from "react";
import { decodeJwt } from "jose";
import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import type { AccessClaims, Role, SessionUser } from "@/lib/definitions";

/**
 * Data Access Layer: única fuente de verdad para "¿quién es el usuario?".
 * Llamar SIEMPRE desde aquí (Server Components, Server Actions, Route Handlers)
 * en vez de leer cookies sueltas. Así el chequeo de auth nunca se olvida.
 *
 * No verificamos la firma del access token aquí: su integridad la garantiza la
 * cookie cifrada (httpOnly + JWE). El token es solo un contenedor de claims.
 * El refresh cuando expira ocurre en `proxy.ts` (que sí puede escribir cookies).
 */

/** Devuelve el usuario actual o `null`. Memoizado por render con `cache()`. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const tokens = await getSessionTokens();
  if (!tokens) return null;

  try {
    const claims = decodeJwt<AccessClaims>(tokens.accessToken);
    // Access expirado → tratar como no autenticado (proxy debería haberlo refrescado).
    if (!claims.exp || claims.exp * 1000 <= Date.now()) return null;

    // DTO: solo lo necesario, nunca el token ni datos sensibles.
    return {
      id: claims.sub,
      name: claims.name,
      email: claims.email,
      role: claims.role,
    };
  } catch {
    return null;
  }
});

/**
 * Exige sesión válida. Redirige a /login si no hay.
 * Úsalo al inicio de páginas/acciones protegidas.
 */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

/** Exige sesión válida + uno de los roles dados. Redirige si no cumple. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await verifySession();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/**
 * Access token para llamar al backend desde Server Components/Actions.
 * (Adjúntalo como `Authorization: Bearer <token>` en tus fetch a la API.)
 */
export const getAccessToken = cache(async (): Promise<string | null> => {
  const tokens = await getSessionTokens();
  return tokens?.accessToken ?? null;
});
