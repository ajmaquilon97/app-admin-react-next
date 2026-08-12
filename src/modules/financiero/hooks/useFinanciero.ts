"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as financieroActions from "../actions/financiero";
import { financieroKeys } from "../constants";
import type { FinancialFilters } from "../types";

export function useFinancialSummary() {
  return useQuery({
    queryKey: financieroKeys.summary,
    queryFn: () => financieroActions.getSummary(),
    staleTime: 1000 * 60,
  });
}

export function useIncome(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: financieroKeys.income(filters),
    queryFn: () => financieroActions.getIncome(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useInvoices(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: financieroKeys.invoices(filters),
    queryFn: () => financieroActions.getInvoices(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useReversals(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: financieroKeys.reversals(filters),
    queryFn: () => financieroActions.getReversals(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useFinancieroSpaces() {
  return useQuery({
    queryKey: financieroKeys.spaces,
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
      queryClient.invalidateQueries({ queryKey: financieroKeys.summary });
    },
  });
}
