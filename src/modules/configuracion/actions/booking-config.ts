"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as spacesApi from "@/lib/spaces-api";
import type { EspacioBookingConfig, EspacioOption, ReservationConfirmationMode } from "../types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

const MODOS_VALIDOS: ReservationConfirmationMode[] = ["inmediata", "pago_confirmacion_manual", "solicitud_aprobacion"];

function toModo(raw: string | null): ReservationConfirmationMode {
  return raw && (MODOS_VALIDOS as string[]).includes(raw) ? (raw as ReservationConfirmationMode) : "inmediata";
}

/** Configuración > Reservas — modoConfirmacion viene embebido en EspacioResponse (GET /api/espacios/mis-espacios). */
export async function getBookingConfigs(espacios: EspacioOption[]): Promise<EspacioBookingConfig[]> {
  if (espacios.length === 0) return [];
  const accessToken = await requireAccessToken();
  const misEspacios = await spacesApi.getMisEspacios(accessToken);
  const porId = new Map(misEspacios.map((e) => [e.id, e]));

  return espacios.map((e) => ({
    espacioId: e.id,
    espacioNombre: e.nombre,
    modo: toModo(porId.get(e.id)?.modoConfirmacion ?? null),
  }));
}

/**
 * Configuración > Reservas — PUT /api/espacios/{id} solo acepta el cuerpo completo de
 * `EspacioRequest` (no un patch parcial), así que se lee el espacio actual primero y se
 * reenvía completo con `modoConfirmacion` cambiado.
 */
export async function updateBookingConfig(
  espacioId: number,
  espacioNombre: string,
  modo: ReservationConfirmationMode,
): Promise<EspacioBookingConfig> {
  const accessToken = await requireAccessToken();
  const actual = await spacesApi.getEspacioById(espacioId, accessToken);

  await spacesApi.updateEspacio(
    espacioId,
    {
      titulo: actual.titulo ?? "",
      descripcion: actual.descripcion ?? "",
      propietarioId: actual.propietarioId ?? "",
      tipoEspacioId: actual.tipoEspacioId,
      provinciaId: actual.provinciaId ?? undefined,
      ciudadId: actual.ciudadId ?? undefined,
      linkUbicacion: actual.linkUbicacion ?? "",
      referencia: actual.referencia ?? "",
      latitud: actual.latitud ?? undefined,
      longitud: actual.longitud ?? undefined,
      validarAforo: actual.validarAforo,
      maxCapacidad: actual.maxCapacidad,
      imagenPortada: actual.imagenPortada ?? undefined,
      imagenesGaleria: actual.imagenesGaleria ?? undefined,
      modoConfirmacion: modo,
    },
    accessToken,
  );

  return { espacioId, espacioNombre, modo };
}
