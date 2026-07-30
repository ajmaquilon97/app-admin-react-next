import type { InvoiceStatus, ReversalStatus, ReversalType } from "../types";

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Autorizada: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Procesando: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Recibida: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Devuelta: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  "No autorizada": "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  Error: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
};

export const REVERSAL_STATUS_STYLES: Record<ReversalStatus, string> = {
  Completado: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Autorizado: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Procesando: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Rechazado: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
};

export const REVERSAL_TYPE_STYLES: Record<ReversalType, string> = {
  NotaCredito: "bg-[#8F0E55]/10 text-[#8F0E55] border-[#8F0E55]/20",
  ReversoPago: "bg-gray-100 text-[#6B7280] border-gray-200",
};

export const REVERSAL_TYPE_LABELS: Record<ReversalType, string> = {
  NotaCredito: "Nota de crédito SRI",
  ReversoPago: "Reverso de pago",
};

export const FINANCIAL_QUERY_KEYS = {
  summary: ["financiero", "summary"] as const,
  income: (filters: object) => ["financiero", "income", filters] as const,
  invoices: (filters: object) => ["financiero", "invoices", filters] as const,
  reversals: (filters: object) => ["financiero", "reversals", filters] as const,
  spaces: ["financiero", "spaces"] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
