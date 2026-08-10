"use client";

import { useQuery } from "@tanstack/react-query";
import * as reservasActions from "@/actions/reservas";
import { BOOKING_QUERY_KEYS } from "../constants";
import type { BookingFilters } from "../types";

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.list(filters),
    queryFn: () => reservasActions.getBookings(filters),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useBookingStatistics() {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.statistics,
    queryFn: () => reservasActions.getStatistics(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useSpaces() {
  return useQuery({
    queryKey: ["booking-spaces"],
    queryFn: () => reservasActions.getSpaceOptions(),
    staleTime: Infinity,
  });
}
