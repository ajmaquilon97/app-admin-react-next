"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookingService } from "../services/BookingService";
import { BOOKING_QUERY_KEYS } from "../constants";
import type {
  CancelBookingPayload,
  ConfirmBookingPayload,
  RegisterAttendancePayload,
  RegisterPaymentPayload,
  RescheduleBookingPayload,
} from "../types";

function invalidateAll(qc: ReturnType<typeof useQueryClient>, bookingId: string) {
  qc.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.detail(bookingId) });
  qc.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all });
  qc.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.statistics });
  // Sincronización con disponibilidad
  qc.invalidateQueries({ queryKey: ["availability"] });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmBookingPayload) => BookingService.confirmBooking(payload),
    onSuccess: (data) => {
      qc.setQueryData(BOOKING_QUERY_KEYS.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Reserva confirmada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelBookingPayload) => BookingService.cancelBooking(payload),
    onSuccess: (data) => {
      qc.setQueryData(BOOKING_QUERY_KEYS.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Reserva cancelada");
      if (data.estadoReverso === "ERROR") {
        toast.warning("El reverso automático (nota de crédito) falló — requiere resolución manual.");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RescheduleBookingPayload) => BookingService.rescheduleBooking(payload),
    onSuccess: (data) => {
      qc.setQueryData(BOOKING_QUERY_KEYS.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Reserva reagendada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPaymentPayload) => BookingService.registerPayment(payload),
    onSuccess: (data) => {
      qc.setQueryData(BOOKING_QUERY_KEYS.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Pago registrado exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegisterAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterAttendancePayload) => BookingService.registerAttendance(payload),
    onSuccess: (data) => {
      qc.setQueryData(BOOKING_QUERY_KEYS.detail(data.id), data);
      qc.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all });
      toast.success(`Asistencia registrada: ${data.attendance}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
