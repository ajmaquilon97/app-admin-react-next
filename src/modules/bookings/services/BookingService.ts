// Mock service — reemplazar el cuerpo de cada método con llamadas HTTP (axios)
// cuando el backend implemente el módulo de reservas.
// La interfaz pública (firmas) no debe cambiar.

import type {
  Booking,
  BookingDetail,
  BookingFilters,
  BookingStatistics,
  CancelBookingPayload,
  ConfirmBookingPayload,
  PagedResponse,
  RegisterAttendancePayload,
  RegisterPaymentPayload,
  RescheduleBookingPayload,
  SpaceOption,
} from "../types";
import { MOCK_BOOKINGS, MOCK_SPACES, MOCK_STATISTICS } from "../mock/data";
import { buildTimelineEvent, delay, filterBookings } from "../utils";
import { canTransition } from "../schemas";

// Estado en memoria (simula base de datos remota)
let _bookings: BookingDetail[] = structuredClone(MOCK_BOOKINGS);

export const BookingService = {
  // ── GET /api/bookings/statistics ───────────────────────────────────────────
  async getStatistics(): Promise<BookingStatistics> {
    await delay(350);
    const hoy = _bookings.filter((b) => b.date === "2026-07-14").length;
    const pendientes = _bookings.filter((b) => b.status === "Pendiente").length;
    const ingresosDia = _bookings
      .filter((b) => b.date === "2026-07-14" && b.status !== "Cancelada")
      .reduce((sum, b) => sum + b.payment.paid, 0);
    return {
      ...MOCK_STATISTICS,
      reservasHoy: hoy,
      pendientes,
      ingresosDia: ingresosDia || MOCK_STATISTICS.ingresosDia,
    };
  },

  // ── GET /api/bookings ──────────────────────────────────────────────────────
  async getBookings(filters: BookingFilters = {}): Promise<PagedResponse<Booking>> {
    await delay(400);
    const filtered = filterBookings(_bookings, filters);
    const page = filters.page ?? 1;
    const size = filters.pageSize ?? 20;
    const start = (page - 1) * size;
    const items: Booking[] = filtered.slice(start, start + size).map(
      ({ timeline: _t, payment: _p, ...b }) => b,
    );
    return {
      items,
      total: filtered.length,
      page,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    };
  },

  // ── GET /api/bookings/{id} ─────────────────────────────────────────────────
  async getBookingDetail(id: string): Promise<BookingDetail> {
    await delay(250);
    const b = _bookings.find((x) => x.id === id);
    if (!b) throw new Error(`Reserva ${id} no encontrada`);
    return structuredClone(b);
  },

  // ── POST /api/bookings/{id}/confirm ───────────────────────────────────────
  async confirmBooking({ bookingId }: ConfirmBookingPayload): Promise<BookingDetail> {
    await delay(500);
    const b = _bookings.find((x) => x.id === bookingId);
    if (!b) throw new Error("Reserva no encontrada");
    if (!canTransition(b.status, "Confirmada"))
      throw new Error(`No se puede confirmar una reserva en estado "${b.status}"`);
    b.status = "Confirmada";
    b.timeline.push(buildTimelineEvent("Reserva confirmada por el administrador", "success"));
    return structuredClone(b);
  },

  // ── POST /api/bookings/{id}/cancel ────────────────────────────────────────
  async cancelBooking({ bookingId, reason }: CancelBookingPayload): Promise<BookingDetail> {
    await delay(500);
    const b = _bookings.find((x) => x.id === bookingId);
    if (!b) throw new Error("Reserva no encontrada");
    if (!canTransition(b.status, "Cancelada"))
      throw new Error(`No se puede cancelar una reserva en estado "${b.status}"`);
    b.status = "Cancelada";
    b.timeline.push(buildTimelineEvent(`Cancelada: ${reason}`, "error"));
    return structuredClone(b);
  },

  // ── POST /api/bookings/{id}/reschedule ────────────────────────────────────
  async rescheduleBooking(payload: RescheduleBookingPayload): Promise<BookingDetail> {
    await delay(600);
    const b = _bookings.find((x) => x.id === payload.bookingId);
    if (!b) throw new Error("Reserva no encontrada");
    if (!canTransition(b.status, "Reagendada"))
      throw new Error(`No se puede reagendar una reserva en estado "${b.status}"`);
    const prevDate = b.dateDisplay;
    b.date = payload.newDate;
    b.dateDisplay = new Date(payload.newDate + "T00:00:00").toLocaleDateString("es-EC", {
      weekday: "short", day: "numeric", month: "short",
    });
    b.startTime = payload.newStartTime;
    b.endTime = payload.newEndTime;
    b.timeDisplay = `${payload.newStartTime} - ${payload.newEndTime}`;
    if (payload.newSpaceId) {
      const space = MOCK_SPACES.find((s) => s.id === payload.newSpaceId);
      if (space) { b.spaceId = space.id; b.spaceName = space.nombre; }
    }
    b.status = "Reagendada";
    b.timeline.push(
      buildTimelineEvent(`Reagendada de ${prevDate} a ${b.dateDisplay} ${b.timeDisplay}`, "info"),
    );
    return structuredClone(b);
  },

  // ── POST /api/bookings/{id}/payment ───────────────────────────────────────
  async registerPayment(payload: RegisterPaymentPayload): Promise<BookingDetail> {
    await delay(450);
    const b = _bookings.find((x) => x.id === payload.bookingId);
    if (!b) throw new Error("Reserva no encontrada");

    if (payload.type === "refund") {
      b.payment.paid = 0;
      b.payment.pending = b.payment.total;
      b.paymentStatus = "Reembolsado";
      b.payment.status = "Reembolsado";
      b.timeline.push(buildTimelineEvent(`Reembolso procesado ($${payload.amount.toFixed(2)})`, "neutral"));
    } else {
      b.payment.paid = Math.min(b.payment.total, b.payment.paid + payload.amount);
      b.payment.pending = Math.max(0, b.payment.total - b.payment.paid);
      b.paymentStatus = b.payment.pending === 0 ? "Pagado" : "Pagado parcialmente";
      b.payment.status = b.paymentStatus;
      b.payment.lastPaymentDate = new Date().toISOString().split("T")[0];
      b.timeline.push(buildTimelineEvent(`Pago recibido ($${payload.amount.toFixed(2)})`, "success"));
    }
    return structuredClone(b);
  },

  // ── POST /api/bookings/{id}/attendance ────────────────────────────────────
  async registerAttendance(payload: RegisterAttendancePayload): Promise<BookingDetail> {
    await delay(300);
    const b = _bookings.find((x) => x.id === payload.bookingId);
    if (!b) throw new Error("Reserva no encontrada");
    b.attendance = payload.status;
    b.timeline.push(
      buildTimelineEvent(
        `Asistencia registrada: ${payload.status}`,
        payload.status === "Asistió" ? "success" : "warning",
      ),
    );
    return structuredClone(b);
  },

  // ── GET /api/spaces (opciones para reagendar) ─────────────────────────────
  async getSpaces(): Promise<SpaceOption[]> {
    await delay(200);
    return structuredClone(MOCK_SPACES);
  },
};
