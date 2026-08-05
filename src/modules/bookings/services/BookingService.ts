// Conectado al backend real (ApiTesis) vía src/actions/reservas.ts.
// La interfaz pública (firmas) se mantiene igual al mock original.

import type {
  Booking,
  BookingDetail,
  BookingFilters,
  BookingStatistics,
  CancelBookingPayload,
  ConfirmBookingPayload,
  GeneratePinRecepcionPayload,
  PagedResponse,
  PinRecepcion,
  RegisterAttendancePayload,
  RegisterPaymentPayload,
  RescheduleBookingPayload,
  SpaceOption,
} from "../types";
import * as reservasActions from "@/actions/reservas";

export const BookingService = {
  async getStatistics(): Promise<BookingStatistics> {
    return reservasActions.getStatistics();
  },

  async getBookings(filters: BookingFilters = {}): Promise<PagedResponse<Booking>> {
    return reservasActions.getBookings(filters);
  },

  async getBookingDetail(id: string): Promise<BookingDetail> {
    return reservasActions.getBookingDetail(id);
  },

  async confirmBooking({ bookingId }: ConfirmBookingPayload): Promise<BookingDetail> {
    return reservasActions.confirmBooking(bookingId);
  },

  async cancelBooking({ bookingId, reason }: CancelBookingPayload): Promise<BookingDetail> {
    return reservasActions.cancelBooking(bookingId, reason);
  },

  async rescheduleBooking(payload: RescheduleBookingPayload): Promise<BookingDetail> {
    return reservasActions.rescheduleBooking(
      payload.bookingId,
      payload.newDate,
      payload.newStartTime,
      payload.newEndTime,
    );
  },

  async registerPayment(payload: RegisterPaymentPayload): Promise<BookingDetail> {
    return reservasActions.registerPayment(payload.bookingId, payload.amount, payload.type, payload.notes);
  },

  async registerAttendance(payload: RegisterAttendancePayload): Promise<BookingDetail> {
    return reservasActions.registerAttendance(payload.bookingId, payload.status);
  },

  async getSpaces(): Promise<SpaceOption[]> {
    return reservasActions.getSpaceOptions();
  },

  async generatePinRecepcion({ bookingId }: GeneratePinRecepcionPayload): Promise<PinRecepcion> {
    return reservasActions.generatePinRecepcion(bookingId);
  },
};
