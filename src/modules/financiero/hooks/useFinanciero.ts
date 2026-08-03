"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FinancieroService } from "../services/FinancieroService";
import { FINANCIAL_QUERY_KEYS } from "../constants";
import type { FinancialFilters } from "../types";

export function useFinancialSummary() {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.summary,
    queryFn: () => FinancieroService.getSummary(),
    staleTime: 1000 * 60,
  });
}

export function useIncome(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.income(filters),
    queryFn: () => FinancieroService.getIncome(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useInvoices(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.invoices(filters),
    queryFn: () => FinancieroService.getInvoices(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useReversals(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.reversals(filters),
    queryFn: () => FinancieroService.getReversals(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useFinancieroSpaces() {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.spaces,
    queryFn: () => FinancieroService.getSpaces(),
    staleTime: Infinity,
  });
}

export function useRetryInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FinancieroService.retryInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financiero", "invoices"] });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEYS.summary });
    },
  });
}
