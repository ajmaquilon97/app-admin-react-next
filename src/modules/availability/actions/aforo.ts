"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as aforoApi from "../api/aforo";
import type { AforoDiaResumen, AforoDiaDetalle } from "../types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** GET /api/aforo — resumen de aforo por día para la tira semanal. */
export async function fetchAforoSemana(
  espacioId: number,
  fechaInicio: string,
  fechaFin: string,
): Promise<AforoDiaResumen[]> {
  const accessToken = await requireAccessToken();
  const raw = await aforoApi.getAforo(espacioId, fechaInicio, fechaFin, accessToken);
  return raw.map((d) => ({
    fecha: d.fecha,
    capacidadTotal: d.capacidadTotal,
    vendida: d.vendida,
    disponible: d.disponible,
  }));
}

/** GET /api/aforo/dia — detalle de ventas de un día (tickets vacío si no eres el dueño). */
export async function fetchAforoDia(espacioId: number, fecha: string): Promise<AforoDiaDetalle> {
  const accessToken = await requireAccessToken();
  const raw = await aforoApi.getAforoDia(espacioId, fecha, accessToken);
  return {
    fecha: raw.fecha,
    capacidadTotal: raw.capacidadTotal,
    vendida: raw.vendida,
    disponible: raw.disponible,
    tickets: raw.tickets.map((t) => ({
      id: `${raw.fecha}-${t.reservaId}`,
      clienteNombre: t.nombreCliente,
      cantidad: t.pax,
      hora: formatHora(t.horaCompra),
    })),
  };
}
