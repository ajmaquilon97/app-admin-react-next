import { z } from "zod";
import type { BookingStatus } from "../types";

const VALID_STATUSES: BookingStatus[] = [
  "Pendiente",
  "Confirmada",
  "Reagendada",
  "Cancelada",
  "Finalizada",
];

// Transiciones de estado válidas
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  Pendiente: ["Confirmada", "Cancelada"],
  Confirmada: ["Reagendada", "Cancelada", "Finalizada"],
  Reagendada: ["Confirmada", "Cancelada"],
  Cancelada: [],
  Finalizada: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
});

export const rescheduleSchema = z.object({
  newDate: z.string().min(1, "Selecciona una fecha"),
  newStartTime: z.string().min(1, "Selecciona la hora de inicio"),
  newEndTime: z.string().min(1, "Selecciona la hora de fin"),
  newSpaceId: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive("Debe ser mayor a 0"),
  type: z.enum(["partial", "full", "refund"]),
  notes: z.string().optional(),
});

export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  spaceId: z.string().optional(),
  status: z.enum(["", "Pendiente", "Confirmada", "Reagendada", "Cancelada", "Finalizada"]).optional(),
  paymentStatus: z.enum(["", "Pendiente", "Pagado parcialmente", "Pagado", "Reembolsado"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["date", "client", "status", "total"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type CancelBookingForm = z.infer<typeof cancelBookingSchema>;
export type RescheduleForm = z.infer<typeof rescheduleSchema>;
export type PaymentForm = z.infer<typeof paymentSchema>;
export type BookingFiltersForm = z.infer<typeof bookingFiltersSchema>;
