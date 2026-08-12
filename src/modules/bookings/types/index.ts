// ── Enums / Union Types ────────────────────────────────────────────────────────

import type { EspacioArchetype } from "@/lib/domain";
export type { EspacioArchetype } from "@/lib/domain";

export type BookingStatus =
  | "Pendiente"
  | "Confirmada"
  | "Reagendada"
  | "Cancelada"
  | "Finalizada";

export type PaymentStatus =
  | "Pendiente"
  | "Pagado parcialmente"
  | "Pagado"
  | "Reembolsado";

export type AttendanceStatus = "No registrado" | "Asistió" | "No asistió";

export type TimelineEventType = "success" | "info" | "warning" | "error" | "neutral";

export type ContactMethod = "email" | "whatsapp" | "phone";

// ── Core Models ────────────────────────────────────────────────────────────────

export interface BookingClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  initials: string;
  avatarColor: string;
}

export interface BookingTimeline {
  id: string;
  title: string;
  date: string;
  time: string;
  type: TimelineEventType;
}

export interface BookingPayment {
  total: number;
  paid: number;
  pending: number;
  status: PaymentStatus;
  lastPaymentDate?: string;
}

export interface BookingAttendance {
  status: AttendanceStatus;
  registeredAt?: string;
}

export interface Booking {
  id: string;
  code: string;
  client: BookingClient;
  spaceId: string;
  spaceName: string;
  date: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
  timeDisplay: string;
  pax: number | null;
  total: number;
  archetype: EspacioArchetype;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  attendance: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export interface BookingDetail extends Booking {
  payment: BookingPayment;
  timeline: BookingTimeline[];
  /** Solo presente justo después de cancelar — resultado del reverso automático (nota de crédito). */
  estadoReverso?: "PROCESANDO" | "ERROR" | null;
}

// ── DTOs / Request Payloads ────────────────────────────────────────────────────

export interface BookingFilters {
  search?: string;
  spaceId?: string;
  status?: BookingStatus | "";
  paymentStatus?: PaymentStatus | "";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "client" | "status" | "total";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ConfirmBookingPayload {
  bookingId: string;
}

export interface CancelBookingPayload {
  bookingId: string;
  reason: string;
}

export interface RescheduleBookingPayload {
  bookingId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

export interface RegisterPaymentPayload {
  bookingId: string;
  amount: number;
  type: "partial" | "full" | "refund";
  notes?: string;
}

export interface RegisterAttendancePayload {
  bookingId: string;
  status: "Asistió" | "No asistió";
}

export interface PinRecepcion {
  pin: string;
  fechaExpiracion: string;
}

export interface GeneratePinRecepcionPayload {
  bookingId: string;
}

// ── Statistics ─────────────────────────────────────────────────────────────────

export interface BookingStatistics {
  reservasHoy: number;
  pendientes: number;
  ingresosDia: number;
  ocupacion: number;
  /** null — el backend no expone comparativo contra el día anterior todavía. */
  variacionIngresos: number | null;
}

// ── Paged Response ─────────────────────────────────────────────────────────────

export type { PagedResponse } from "@/lib/domain";

// ── Space Option (for reschedule) ─────────────────────────────────────────────

export interface SpaceOption {
  id: string;
  nombre: string;
  tipoEspacioNombre?: string | null;
}
