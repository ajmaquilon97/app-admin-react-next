// ── Enums / Union Types ────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "Procesando"
  | "Recibida"
  | "Autorizada"
  | "Devuelta"
  | "No autorizada"
  | "Error";

/**
 * Catálogo real de `GET /api/reversos` (`NotaCreditoResponse.estado`). El backend solo
 * trackea notas de crédito — no existe el concepto "ReversoPago" que se había pedido en
 * `docs/backend-financiero-spec.md §4`; todo reverso en este listado es una nota de
 * crédito SRI.
 */
export type ReversalStatus = "Procesando" | "Enviada" | "Autorizada" | "Rechazada" | "Anulada";

// ── Core Models ────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  ingresosMes: number;
  variacionIngresos: number | null;
  facturasAutorizadas: number;
  facturasConError: number;
  totalReversado: number;
  serieIngresos: { fecha: string; monto: number }[];
}

export interface IncomeEntry {
  id: string;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  /**
   * NO es el mismo identificador que `FinancialFilters.spaceId` (number). El spec de
   * ingresos lo declara como guid (`docs/backend-financiero-spec.md §2`) y hoy no se
   * consume en la UI, que muestra `spaceName`. Confirmar con backend antes de usarlo
   * para filtrar o comparar contra un `EspacioOption.id`.
   */
  spaceId: string;
  spaceName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  invoiceStatus: InvoiceStatus | null; // null = aún no facturada
  invoiceId: string | null;
}

export interface Invoice {
  id: string;
  bookingId: string;
  bookingCode: string;
  numeroComprobante: string;
  claveAcceso: string;
  clientName: string;
  clientIdentification: string;
  fechaEmision: string;
  fechaAutorizacion: string | null;
  estado: InvoiceStatus;
  subtotal: number;
  iva: number;
  total: number;
  ridePdfUrl: string | null;
  motivoRechazo: string | null;
}

export interface Reversal {
  id: string;
  facturaId: string | null;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  monto: number;
  motivo: string;
  estado: ReversalStatus;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  claveAcceso: string | null; // presente una vez autorizada
}

// ── Filters / Payloads ─────────────────────────────────────────────────────────

export interface FinancialFilters {
  search?: string;
  spaceId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ── Paged Response ─────────────────────────────────────────────────────────────

export type { PagedResponse } from "@/lib/domain";

// ── Space Option ───────────────────────────────────────────────────────────────

export type { EspacioOption } from "@/lib/domain";
