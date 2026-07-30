// Por ahora conectado a datos mock (src/lib/financiero-mock.ts). Cuando el backend
// exponga los endpoints de la spec (docs/backend-facturacion-electronica-sri-spec.md),
// este archivo pasa a delegar en un Server Action (src/actions/financiero.ts), igual
// que hizo BookingService — la interfaz pública no debería cambiar.
import type {
  FinancialFilters,
  FinancialSummary,
  IncomeEntry,
  Invoice,
  PagedResponse,
  RequestReversalPayload,
  Reversal,
  SpaceOption,
} from "../types";
import * as financieroMock from "@/lib/financiero-mock";

export const FinancieroService = {
  async getSummary(): Promise<FinancialSummary> {
    return financieroMock.getFinancialSummary();
  },

  async getIncome(filters: FinancialFilters = {}): Promise<PagedResponse<IncomeEntry>> {
    return financieroMock.getIncome(filters);
  },

  async getInvoices(filters: FinancialFilters = {}): Promise<PagedResponse<Invoice>> {
    return financieroMock.getInvoices(filters);
  },

  async getReversals(filters: FinancialFilters = {}): Promise<PagedResponse<Reversal>> {
    return financieroMock.getReversals(filters);
  },

  async retryInvoice(id: string): Promise<Invoice> {
    return financieroMock.retryInvoice(id);
  },

  async requestReversal(payload: RequestReversalPayload): Promise<Reversal> {
    return financieroMock.requestReversal(payload);
  },

  async getSpaces(): Promise<SpaceOption[]> {
    return financieroMock.getFinancieroSpaces();
  },
};
