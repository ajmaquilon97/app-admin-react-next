import * as z from "zod";

/**
 * Modelo de roles de RecreAdmin (RBAC simple).
 * El rol viaja como claim dentro del access token que emite el backend.
 */
export const ROLES = ["admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

/** Datos mínimos del usuario expuestos a la app (DTO, sin datos sensibles). */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Claims del access token (lo que tu backend mete en el JWT).
 * `exp`/`iat` son segundos UNIX (estándar JWT).
 */
export type AccessClaims = {
  sub: string;
  name: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};

/** Par de tokens que devuelve el backend al autenticar. */
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

// — Validación de formularios (servidor) —

export const LoginSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z.string().min(1, { error: "La contraseña es obligatoria." }),
});

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres." })
    .trim(),
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z
    .string()
    .min(8, { error: "Debe tener al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Debe incluir al menos una letra." })
    .regex(/[0-9]/, { error: "Debe incluir al menos un número." }),
});

/** Estado que devuelven las Server Actions a `useActionState`. */
export type AuthFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
