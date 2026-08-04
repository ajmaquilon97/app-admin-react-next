"use server";

import * as usuariosApi from "@/lib/usuarios-api";
import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import type { PerfilAnfitrion } from "@/modules/configuracion/types";

/**
 * Configuración > Perfil — GET /api/usuarios/{id} del usuario autenticado.
 * Los datos fiscales del negocio (RUC, razón social, dirección) NO se leen acá —
 * viven en Configuración > Negocio (ver src/actions/negocio.ts), separados del perfil
 * personal (docs/backend-cambios-solicitados.md §12).
 * `telefono` sigue sin fuente real: no está en `UsuarioResponse` (se gestiona por el
 * flujo de OTP SMS, no por este GET) — queda vacío hasta que backend lo exponga.
 */
export async function getPerfil(): Promise<PerfilAnfitrion> {
  const user = await verifySession();
  const tokens = await getSessionTokens();
  if (!tokens) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  const usuario = await usuariosApi.getUsuario(user.id, tokens.accessToken);
  return {
    nombre: usuario.nombre ?? "",
    apellido: usuario.apellido ?? "",
    email: usuario.correo ?? user.email,
    telefono: "",
    fotoPerfilUrl: usuario.fotoPerfilUrl ?? "",
    documentoIdentidadUrl: usuario.rutaFotoCedula ?? "",
    numeroCedula: usuario.numeroCedula ?? "",
    fechaNacimiento: usuario.fechaNacimiento ?? "",
  };
}

/**
 * Configuración > Perfil — PUT /api/usuarios/{id}. No reenvía `tipoUsuarioId` (se omite
 * para no tocar el rol ya asignado en el registro/onboarding), ni los datos fiscales del
 * negocio (RUC/razón social/dirección — ver src/actions/negocio.ts). `telefono` tampoco
 * forma parte de `CompletarPerfilRequest` — no se persiste por este medio.
 */
export async function updatePerfil(input: PerfilAnfitrion): Promise<PerfilAnfitrion> {
  const user = await verifySession();
  const tokens = await getSessionTokens();
  if (!tokens) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  await usuariosApi.completeProfile(user.id, tokens.accessToken, {
    nombre: input.nombre,
    apellido: input.apellido,
    numeroCedula: input.numeroCedula,
    fechaNacimiento: input.fechaNacimiento,
    rutaFotoCedula: input.documentoIdentidadUrl,
    fotoPerfilUrl: input.fotoPerfilUrl,
  });

  return input;
}
