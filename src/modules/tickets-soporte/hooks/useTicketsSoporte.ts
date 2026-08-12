"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as ticketsActions from "../actions/tickets-soporte";
import { ticketsKeys } from "../constants";
import type { TicketFilters } from "../types";

export function useTicketsSoporte(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketsKeys.list(filters),
    queryFn: () => ticketsActions.getTicketsSoporte(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, aprobado, notas }: { ticketId: string; aprobado: boolean; notas: string }) =>
      ticketsActions.resolveTicket(ticketId, aprobado, notas),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ticketsKeys.all });
      toast.success(variables.aprobado ? "Ticket aprobado — reverso disparado." : "Ticket rechazado.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
