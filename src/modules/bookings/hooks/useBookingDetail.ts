"use client";

import { useQuery } from "@tanstack/react-query";
import * as reservasActions from "@/actions/reservas";
import { BOOKING_QUERY_KEYS } from "../constants";

export function useBookingDetail(id: string | null) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => reservasActions.getBookingDetail(id!),
    enabled: id != null,
    staleTime: 1000 * 30,
  });
}
