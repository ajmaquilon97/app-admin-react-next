import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  decryptSession,
  encryptSession,
} from "@/lib/session-crypto";
import * as authApi from "@/lib/auth-api";
import type { TokenPair } from "@/lib/definitions";

/**
 * Proxy (antes "middleware"): chequeo OPTIMISTA de auth + refresh transparente.
 *
 * - Solo lee la cookie cifrada; NO consulta base de datos / API salvo refresh.
 * - Si el access token expiró, rota el par contra el backend y re-setea la cookie.
 * - Redirige login↔dashboard. La seguridad REAL vive en el DAL y en cada acción.
 */

const AUTH_ROUTES = ["/login", "/signup"];
const PUBLIC_ROUTES = ["/politicas-de-privacidad"]; // accesibles sin sesión
const CLOCK_SKEW_MS = 30_000; // refresca 30s antes para evitar carreras

function isAccessExpired(accessToken: string): boolean {
  try {
    const { exp } = decodeJwt(accessToken);
    if (!exp) return true;
    return exp * 1000 <= Date.now() + CLOCK_SKEW_MS;
  } catch {
    return true;
  }
}

function setSessionCookie(res: NextResponse, jwe: string): void {
  res.cookies.set(SESSION_COOKIE, jwe, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  let tokens: TokenPair | null = cookie ? await decryptSession(cookie) : null;
  let refreshedJwe: string | null = null;

  // Refresca el access si está expirado (o por expirar).
  if (tokens && isAccessExpired(tokens.accessToken)) {
    try {
      tokens = await authApi.refresh(tokens.refreshToken);
      refreshedJwe = await encryptSession(tokens);
    } catch {
      tokens = null; // refresh inválido → tratar como sin sesión
    }
  }

  const isAuthed = tokens !== null;

  // Sin sesión en ruta protegida → al login.
  if (!isAuthed && !isAuthRoute && !isPublicRoute) {
    const res = NextResponse.redirect(new URL("/login", request.nextUrl));
    if (cookie) res.cookies.delete(SESSION_COOKIE); // limpia cookie inválida
    return res;
  }

  // Con sesión en login/signup → al dashboard.
  if (isAuthed && isAuthRoute) {
    const res = NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    if (refreshedJwe) setSessionCookie(res, refreshedJwe);
    return res;
  }

  // Continúa; adjunta la cookie rotada si hubo refresh.
  const res = NextResponse.next();
  if (refreshedJwe) setSessionCookie(res, refreshedJwe);
  return res;
}

export const config = {
  // Corre en todo excepto API, assets de Next y archivos estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
