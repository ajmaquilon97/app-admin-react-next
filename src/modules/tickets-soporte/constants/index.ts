import type { TicketFilters } from "../types";

export const ticketsKeys = {
  all: ["tickets-soporte"] as const,
  list: (filters: TicketFilters) => ["tickets-soporte", "list", filters] as const,
};
