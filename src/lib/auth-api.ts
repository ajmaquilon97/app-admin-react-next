import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser, TokenPair } from "@/lib/definitions";

/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  FASE MOCK — Backend simulado                                        ║
 * ║                                                                      ║
 * ║  Este archivo imita tu API de auth (login/register/refresh).         ║
 * ║  Cuando tengas el backend real, reemplaza el CUERPO de cada función  ║
 * ║  por un `fetch(process.env.API_BASE_URL + ...)`. La FIRMA pública    ║
 * ║  (parámetros y `TokenPair` de retorno) NO debe cambiar: así el resto ║
 * ║  de la app (session, dal, proxy, acciones) sigue funcionando igual.  ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

const MOCK_SECRET = new TextEncoder().encode(process.env.MOCK_JWT_SECRET);

const ACCESS_TTL = "15m"; // access token corto
const REFRESH_TTL = "7d"; // refresh token largo

type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string; // mock: en claro. El backend real hashea (bcrypt/argon2).
  role: Role;
};

// "Base de datos" en memoria. Se reinicia con el servidor (es un mock).
const users = new Map<string, MockUser>();

// Usuario sembrado para poder entrar sin registrarte:  admin@recreadmin.com / Admin123
users.set("admin@recreadmin.com", {
  id: "usr_admin",
  name: "Carlos Admin",
  email: "admin@recreadmin.com",
  password: "Admin123",
  role: "admin",
});

let nextId = 1;

async function signAccess(u: SessionUser): Promise<string> {
  return new SignJWT({ name: u.name, email: u.email, role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(MOCK_SECRET);
}

async function signRefresh(u: SessionUser): Promise<string> {
  // El refresh lleva la identidad completa para poder re-emitir sin consultar
  // el "store" (así el refresh en proxy no depende del estado en memoria).
  return new SignJWT({ type: "refresh", name: u.name, email: u.email, role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(MOCK_SECRET);
}

async function issueTokens(u: SessionUser): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccess(u),
    signRefresh(u),
  ]);
  return { accessToken, refreshToken };
}

/** Error de auth con mensaje seguro para mostrar al usuario. */
export class AuthError extends Error {}

/** POST /auth/login — valida credenciales y devuelve el par de tokens. */
export async function login(
  email: string,
  password: string,
): Promise<TokenPair> {
  const user = users.get(email.toLowerCase());
  if (!user || user.password !== password) {
    throw new AuthError("Correo o contraseña incorrectos.");
  }
  return issueTokens(user);
}

/** POST /auth/register — crea el usuario y devuelve el par de tokens. */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<TokenPair> {
  const key = email.toLowerCase();
  if (users.has(key)) {
    throw new AuthError("Ya existe una cuenta con este correo.");
  }
  const user: MockUser = {
    id: `usr_${nextId++}`,
    name,
    email: key,
    password,
    role: "staff", // los registros nuevos entran como staff; admin se asigna aparte
  };
  users.set(key, user);
  return issueTokens(user);
}

/**
 * Login con Google (OAuth).
 *
 * FASE MOCK: simula que un usuario volvió de Google ya autenticado y hace
 * "upsert" en el store. NO contacta a Google.
 *
 * REAL: este flujo es una REDIRECCIÓN, no una llamada directa. El botón debe
 * mandar al usuario al endpoint de tu backend (p. ej. GET /auth/google), que
 * redirige a Google, recibe el callback, intercambia el `code`, hace upsert del
 * usuario y emite el par de tokens. Aquí solo quedaría leer ese resultado.
 * Ver el server action `loginWithGoogle` para el punto exacto del swap.
 */
export async function loginWithGoogle(): Promise<TokenPair> {
  const key = "google.user@gmail.com";
  let user = users.get(key);
  if (!user) {
    user = {
      id: `usr_${nextId++}`,
      name: "Usuaria Google",
      email: key,
      password: "", // sin contraseña: cuenta federada
      role: "staff",
    };
    users.set(key, user);
  }
  return issueTokens(user);
}

/** POST /auth/refresh — rota el par de tokens a partir de un refresh válido. */
export async function refresh(refreshToken: string): Promise<TokenPair> {
  try {
    const { payload } = await jwtVerify(refreshToken, MOCK_SECRET);
    if (payload.type !== "refresh" || !payload.sub) {
      throw new Error("not a refresh token");
    }
    // Re-emite a partir de los claims del refresh (sin tocar el store).
    return issueTokens({
      id: payload.sub,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    });
  } catch {
    throw new AuthError("Sesión expirada. Inicia sesión de nuevo.");
  }
}
