"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as reservasActions from "../actions/reservas";
import { bookingKeys } from "../constants";
import type {
  CancelBookingPayload,
  ConfirmBookingPayload,
  GeneratePinRecepcionPayload,
  RegisterAttendancePayload,
  RegisterPaymentPayload,
  RescheduleBookingPayload,
} from "../types";

function invalidateAll(qc: ReturnType<typeof useQueryClient>, bookingId: string) {
  qc.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
  qc.invalidateQueries({ queryKey: bookingKeys.all });
  qc.invalidateQueries({ queryKey: bookingKeys.statistics });
  // Sincronización con disponibilidad
  qc.invalidateQueries({ queryKey: ["availability"] });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmBookingPayload) => reservasActions.confirmBooking(payload.bookingId),
    onSuccess: (data) => {
      qc.setQueryData(bookingKeys.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Reserva confirmada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelBookingPayload) =>
      reservasActions.cancelBooking(payload.bookingId, payload.reason),
    onSuccess: (data) => {
      qc.setQueryData(bookingKeys.detail(data.id), data);
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
    mutationFn: (payload: RescheduleBookingPayload) =>
      reservasActions.rescheduleBooking(
        payload.bookingId,
        payload.newDate,
        payload.newStartTime,
        payload.newEndTime,
      ),
    onSuccess: (data) => {
      qc.setQueryData(bookingKeys.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Reserva reagendada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPaymentPayload) =>
      reservasActions.registerPayment(
        payload.bookingId,
        payload.amount,
        payload.type,
        payload.notes,
      ),
    onSuccess: (data) => {
      qc.setQueryData(bookingKeys.detail(data.id), data);
      invalidateAll(qc, data.id);
      toast.success("Pago registrado exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGeneratePinRecepcion() {
  return useMutation({
    mutationFn: (payload: GeneratePinRecepcionPayload) =>
      reservasActions.generatePinRecepcion(payload.bookingId),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegisterAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterAttendancePayload) =>
      reservasActions.registerAttendance(payload.bookingId, payload.status),
    onSuccess: (data) => {
      qc.setQueryData(bookingKeys.detail(data.id), data);
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success(`Asistencia registrada: ${data.attendance}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
