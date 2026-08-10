"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as financieroActions from "@/actions/financiero";
import { FINANCIAL_QUERY_KEYS } from "../constants";
import type { FinancialFilters } from "../types";

export function useFinancialSummary() {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.summary,
    queryFn: () => financieroActions.getSummary(),
    staleTime: 1000 * 60,
  });
}

export function useIncome(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.income(filters),
    queryFn: () => financieroActions.getIncome(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useInvoices(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.invoices(filters),
    queryFn: () => financieroActions.getInvoices(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useReversals(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.reversals(filters),
    queryFn: () => financieroActions.getReversals(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useFinancieroSpaces() {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.spaces,
    queryFn: () => financieroActions.getFinancieroSpaces(),
    staleTime: Infinity,
  });
}

export function useRetryInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financieroActions.retryInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financiero", "invoices"] });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_QUERY_KEYS.summary });
    },
  });
}
