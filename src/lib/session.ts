import "server-only";
import { cookies } from "next/headers";
import type { TokenPair } from "@/lib/definitions";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encryptSession,
  decryptSession,
} from "@/lib/session-crypto";

/**
 * Sesión sobre la cookie `httpOnly` cifrada (JWE) que envuelve los tokens del
 * backend. El cifrado da integridad y oculta los claims (rol/email).
 *
 * Nota: `.set`/`.delete` solo funcionan dentro de una Server Action o Route
 * Handler (no durante el render de un Server Component).
 */

export async function createSession(tokens: TokenPair): Promise<void> {
  const jwe = await encryptSession(tokens);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwe, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
  });
}

/** Lee y descifra la cookie. Devuelve el par de tokens o `null`. */
export async function getSessionTokens(): Promise<TokenPair | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return decryptSession(cookie);
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
