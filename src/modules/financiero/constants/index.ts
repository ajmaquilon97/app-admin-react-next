import type { InvoiceStatus, ReversalStatus } from "../types";

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Autorizada: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Procesando: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Recibida: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Devuelta: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  "No autorizada": "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  Error: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
};

export const REVERSAL_STATUS_STYLES: Record<ReversalStatus, string> = {
  Autorizada: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Procesando: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Enviada: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Rechazada: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  Anulada: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
};

export const FINANCIAL_QUERY_KEYS = {
  summary: ["financiero", "summary"] as const,
  income: (filters: object) => ["financiero", "income", filters] as const,
  invoices: (filters: object) => ["financiero", "invoices", filters] as const,
  reversals: (filters: object) => ["financiero", "reversals", filters] as const,
  spaces: ["financiero", "spaces"] as const,
};

export const DEFAULT_PAGE_SIZE = 10;
