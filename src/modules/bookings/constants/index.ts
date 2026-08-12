import type { BookingStatus, PaymentStatus, AttendanceStatus } from "../types";

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  Confirmada: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  Pendiente:  "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  Reagendada: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  Cancelada:  "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  Finalizada: "bg-gray-100 text-text-muted border-gray-200",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  Pagado:               "text-[#27AE60] bg-[#27AE60]/10",
  "Pagado parcialmente":"text-[#3B82F6] bg-[#3B82F6]/10",
  Pendiente:            "text-[#F59E0B] bg-[#F59E0B]/10",
  Reembolsado:          "text-text-muted bg-gray-100",
};

export const bookingKeys = {
  all:        ["bookings"] as const,
  list:       (filters: object) => ["bookings", "list", filters] as const,
  detail:     (id: string) => ["bookings", "detail", id] as const,
  statistics: ["bookings", "statistics"] as const,
};

export const DEFAULT_PAGE_SIZE = 20;
