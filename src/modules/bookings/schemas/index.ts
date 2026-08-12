import { z } from "zod";

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
});

export const rescheduleSchema = z.object({
  newDate: z.string().min(1, "Selecciona una fecha"),
  newStartTime: z.string().min(1, "Selecciona la hora de inicio"),
  newEndTime: z.string().min(1, "Selecciona la hora de fin"),
});

export const paymentSchema = z.object({
  amount: z.number().positive("Debe ser mayor a 0"),
  type: z.enum(["partial", "full", "refund"]),
  notes: z.string().optional(),
});

export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  spaceId: z.coerce.number().optional(),
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
