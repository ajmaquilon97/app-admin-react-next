"use server";

import * as negociosApi from "@/lib/negocios-api";
import { getSessionTokens } from "@/lib/session";
import type { NegocioInfo } from "@/modules/configuracion/types";

const NEGOCIO_VACIO: NegocioInfo = {
  nombreNegocio: "",
  ruc: "",
  razonSocial: "",
  categoria: "",
  direccion: "",
  provinciaId: 0,
  ciudadId: 0,
  telefonoNegocio: "",
  descripcion: "",
  logoUrl: "",
};

/** Configuración > Negocio — GET /api/negocios/me del usuario autenticado. */
export async function getNegocio(): Promise<NegocioInfo> {
  const tokens = await getSessionTokens();
  if (!tokens) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  const negocio = await negociosApi.getNegocio(tokens.accessToken);
  if (!negocio) return NEGOCIO_VACIO;

  return {
    nombreNegocio: negocio.nombreNegocio ?? "",
    ruc: negocio.numeroIdentificacion ?? "",
    razonSocial: negocio.razonSocial ?? "",
    categoria: negocio.categoria ?? "",
    direccion: negocio.direccion ?? "",
    provinciaId: negocio.provinciaId ?? 0,
    ciudadId: negocio.ciudadId ?? 0,
    telefonoNegocio: negocio.telefonoNegocio ?? "",
    descripcion: negocio.descripcion ?? "",
    logoUrl: negocio.logoUrl ?? "",
  };
}

/** Configuración > Negocio — PUT /api/negocios/me (upsert). */
export async function updateNegocio(input: NegocioInfo): Promise<NegocioInfo> {
  const tokens = await getSessionTokens();
  if (!tokens) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  await negociosApi.upsertNegocio(tokens.accessToken, {
    nombreNegocio: input.nombreNegocio,
    tipoIdentificacion: "04",
    numeroIdentificacion: input.ruc,
    razonSocial: input.razonSocial,
    direccion: input.direccion,
    categoria: input.categoria,
    telefonoNegocio: input.telefonoNegocio,
    descripcion: input.descripcion,
    logoUrl: input.logoUrl,
    provinciaId: input.provinciaId || undefined,
    ciudadId: input.ciudadId || undefined,
  });

  return input;
}
