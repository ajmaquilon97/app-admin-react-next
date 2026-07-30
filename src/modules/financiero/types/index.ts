// ── Enums / Union Types ────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "Procesando"
  | "Recibida"
  | "Autorizada"
  | "Devuelta"
  | "No autorizada"
  | "Error";

export type ReversalType = "NotaCredito" | "ReversoPago";

export type ReversalStatus = "Procesando" | "Autorizado" | "Rechazado" | "Completado";

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
  tipo: ReversalType;
  facturaId: string | null; // solo si tipo = NotaCredito
  bookingId: string;
  bookingCode: string;
  clientName: string;
  monto: number;
  motivo: string;
  estado: ReversalStatus;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  claveAcceso: string | null; // solo NotaCredito, una vez autorizada
}

// ── Filters / Payloads ─────────────────────────────────────────────────────────

export interface FinancialFilters {
  search?: string;
  spaceId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface RequestReversalPayload {
  bookingId: string;
  tipo: ReversalType;
  monto: number;
  motivo: string;
}

// ── Paged Response ─────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Space Option ───────────────────────────────────────────────────────────────

export interface SpaceOption {
  id: string;
  nombre: string;
}
