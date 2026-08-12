"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as ticketsApi from "../api/tickets-soporte";
import type { PagedResponse, TicketEstado, TicketFilters, TicketSoporte } from "../types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

const ESTADO_TO_LABEL: Record<TicketEstado, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

function toTicket(t: ticketsApi.TicketSoporteResponseApi): TicketSoporte {
  return {
    id: t.id,
    reservaId: t.reservaId,
    reservaCodigo: t.reservaCodigo ?? `RES-${t.reservaId}`,
    clienteNombre: t.clienteNombre ?? "Cliente sin nombre",
    descripcion: t.descripcion,
    estado: t.estado,
    estadoLabel: ESTADO_TO_LABEL[t.estado],
    resolucionNotas: t.resolucionNotas,
    fechaCreacion: t.fechaCreacion,
    fechaResolucion: t.resueltoAt,
  };
}

export async function getTicketsSoporte(filters: TicketFilters = {}): Promise<PagedResponse<TicketSoporte>> {
  const accessToken = await requireAccessToken();
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 20;

  const resp = await ticketsApi.listTicketsSoporte(
    { estado: filters.estado || undefined, page: page - 1, size },
    accessToken,
  );

  return {
    items: (resp.content ?? []).map(toTicket),
    total: resp.totalElements,
    page: resp.number + 1,
    pageSize: size,
    totalPages: resp.totalPages,
  };
}

export async function resolveTicket(
  ticketId: string,
  aprobado: boolean,
  notas: string,
): Promise<TicketSoporte> {
  const accessToken = await requireAccessToken();
  const result = await ticketsApi.resolverTicket(ticketId, { aprobado, notas }, accessToken);
  return toTicket(result);
}
