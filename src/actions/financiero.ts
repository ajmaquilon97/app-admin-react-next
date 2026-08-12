"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as financieroApi from "@/lib/financiero-api";
import { getSpaceOptions } from "@/actions/reservas";
import type {
  FinancialFilters,
  FinancialSummary,
  IncomeEntry,
  Invoice,
  PagedResponse,
  Reversal,
  EspacioOption,
} from "@/modules/financiero/types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

const ESTADO_REVERSO_TO_LABEL: Record<financieroApi.NotaCreditoEstadoApi, Reversal["estado"]> = {
  procesando: "Procesando",
  enviada: "Enviada",
  autorizada: "Autorizada",
  rechazada: "Rechazada",
  anulada: "Anulada",
};

const LABEL_TO_ESTADO_REVERSO: Record<Reversal["estado"], financieroApi.NotaCreditoEstadoApi> = {
  Procesando: "procesando",
  Enviada: "enviada",
  Autorizada: "autorizada",
  Rechazada: "rechazada",
  Anulada: "anulada",
};

function toIncomeEntry(i: financieroApi.IngresoItemApi): IncomeEntry {
  return {
    id: i.id,
    bookingId: i.bookingId,
    bookingCode: i.bookingCode,
    clientName: i.clientName,
    spaceId: i.spaceId,
    spaceName: i.spaceName,
    amount: i.amount,
    paymentMethod: i.paymentMethod,
    paymentDate: i.paymentDate,
    invoiceStatus: i.invoiceStatus,
    invoiceId: i.invoiceId,
  };
}

function toInvoice(f: financieroApi.FacturaItemApi): Invoice {
  return {
    id: f.id,
    bookingId: f.bookingId,
    bookingCode: f.bookingCode,
    numeroComprobante: f.numeroComprobante,
    claveAcceso: f.claveAcceso,
    clientName: f.clientName,
    clientIdentification: f.clientIdentification,
    fechaEmision: f.fechaEmision,
    fechaAutorizacion: f.fechaAutorizacion,
    estado: f.estado,
    subtotal: f.subtotal,
    iva: f.iva,
    total: f.total,
    ridePdfUrl: f.ridePdfUrl,
    motivoRechazo: f.motivoRechazo,
  };
}

function toReversal(r: financieroApi.NotaCreditoResponseApi): Reversal {
  return {
    id: r.id,
    facturaId: r.facturaId,
    bookingId: r.bookingId,
    bookingCode: r.bookingCode,
    clientName: r.clientName,
    monto: r.monto,
    motivo: r.motivo,
    estado: ESTADO_REVERSO_TO_LABEL[r.estado],
    fechaSolicitud: r.fechaSolicitud,
    fechaResolucion: r.fechaResolucion,
    claveAcceso: r.claveAcceso,
  };
}

export async function getSummary(): Promise<FinancialSummary> {
  const accessToken = await requireAccessToken();
  const resumen = await financieroApi.getResumen({}, accessToken);
  return {
    ingresosMes: resumen.ingresosMes,
    variacionIngresos: resumen.variacionIngresos,
    facturasAutorizadas: resumen.facturasAutorizadas,
    facturasConError: resumen.facturasConError,
    totalReversado: resumen.totalReversado,
    serieIngresos: resumen.serieIngresos ?? [],
  };
}

export async function getIncome(filters: FinancialFilters = {}): Promise<PagedResponse<IncomeEntry>> {
  const accessToken = await requireAccessToken();
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 10;
  const resp = await financieroApi.getIngresos({ page: page - 1, size }, accessToken);

  return {
    items: (resp.items ?? []).map(toIncomeEntry),
    total: resp.total,
    page: resp.page + 1,
    pageSize: resp.pageSize ?? size,
    totalPages: resp.totalPages,
  };
}

export async function getInvoices(filters: FinancialFilters = {}): Promise<PagedResponse<Invoice>> {
  const accessToken = await requireAccessToken();
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 10;
  const resp = await financieroApi.getFacturas(
    {
      search: filters.search,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: page - 1,
      size,
    },
    accessToken,
  );

  return {
    items: (resp.items ?? []).map(toInvoice),
    total: resp.total,
    page: resp.page + 1,
    pageSize: resp.pageSize ?? size,
    totalPages: resp.totalPages,
  };
}

export async function getReversals(filters: FinancialFilters = {}): Promise<PagedResponse<Reversal>> {
  const accessToken = await requireAccessToken();
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 10;
  const estado = filters.status ? LABEL_TO_ESTADO_REVERSO[filters.status as Reversal["estado"]] : undefined;
  const resp = await financieroApi.getReversos(
    { estado, from: filters.dateFrom, to: filters.dateTo, page: page - 1, size },
    accessToken,
  );

  return {
    items: (resp.items ?? []).map(toReversal),
    total: resp.total,
    page: resp.page + 1,
    pageSize: resp.pageSize ?? size,
    totalPages: resp.totalPages,
  };
}

export async function retryInvoice(id: string): Promise<{ id: string; estado: Invoice["estado"] }> {
  const accessToken = await requireAccessToken();
  const result = await financieroApi.reintentarFactura(id, accessToken);
  return { id: result.id, estado: result.estado };
}

export async function getFinancieroSpaces(): Promise<EspacioOption[]> {
  return getSpaceOptions();
}
