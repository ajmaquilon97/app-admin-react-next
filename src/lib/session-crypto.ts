import { EncryptJWT, jwtDecrypt } from "jose";
import type { TokenPair } from "@/lib/definitions";

/**
 * Cifrado puro de la sesión (sin dependencias de `next/headers`), para poder
 * reutilizarlo tanto en Server Components/Actions (via `session.ts`) como en
 * `proxy.ts`, que maneja cookies sobre el request/response directamente.
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 días (igual que el refresh)

function encodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Falta SESSION_SECRET en el entorno.");
  // base64 de 32 bytes → clave para A256GCM.
  return Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
}

export async function encryptSession(tokens: TokenPair): Promise<string> {
  return new EncryptJWT({ ...tokens })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(encodedKey());
}

export async function decryptSession(jwe: string): Promise<TokenPair | null> {
  try {
    const { payload } = await jwtDecrypt(jwe, encodedKey());
    const { accessToken, refreshToken } = payload as Partial<TokenPair>;
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}
