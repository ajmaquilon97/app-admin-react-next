// Conectado al backend real (ApiTesis) vía src/actions/financiero.ts.
// La interfaz pública se mantiene igual a la que usaba el mock original — salvo
// `retryInvoice`, que ahora devuelve solo `{ id, estado }` (el backend responde
// 202 Accepted sin la factura completa, ver docs/backend-financiero-spec.md §3.2).
import type {
  FinancialFilters,
  FinancialSummary,
  IncomeEntry,
  Invoice,
  PagedResponse,
  Reversal,
  SpaceOption,
} from "../types";
import * as financieroActions from "@/actions/financiero";

export const FinancieroService = {
  async getSummary(): Promise<FinancialSummary> {
    return financieroActions.getSummary();
  },

  async getIncome(filters: FinancialFilters = {}): Promise<PagedResponse<IncomeEntry>> {
    return financieroActions.getIncome(filters);
  },

  async getInvoices(filters: FinancialFilters = {}): Promise<PagedResponse<Invoice>> {
    return financieroActions.getInvoices(filters);
  },

  async getReversals(filters: FinancialFilters = {}): Promise<PagedResponse<Reversal>> {
    return financieroActions.getReversals(filters);
  },

  async retryInvoice(id: string): Promise<{ id: string; estado: Invoice["estado"] }> {
    return financieroActions.retryInvoice(id);
  },

  async getSpaces(): Promise<SpaceOption[]> {
    return financieroActions.getFinancieroSpaces();
  },
};
