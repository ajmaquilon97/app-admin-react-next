"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as reservasApi from "@/lib/reservas/api";
import { getMisEspacios } from "@/lib/spaces-api";
import type {
  Booking,
  BookingDetail,
  BookingFilters,
  BookingStatistics,
  BookingTimeline,
  PagedResponse,
  SpaceOption,
  BookingStatus,
  PaymentStatus,
  AttendanceStatus,
  TimelineEventType,
} from "@/modules/bookings/types";

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

// ── Mapeo de enums (backend snake/lowercase ↔ frontend display) ────────────────

const ESTADO_TO_STATUS: Record<reservasApi.EstadoReservaApi, BookingStatus> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  reagendada: "Reagendada",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
};

const STATUS_TO_ESTADO: Record<BookingStatus, reservasApi.EstadoReservaApi> = {
  Pendiente: "pendiente",
  Confirmada: "confirmada",
  Reagendada: "reagendada",
  Cancelada: "cancelada",
  Finalizada: "finalizada",
};

const ESTADO_PAGO_TO_STATUS: Record<reservasApi.EstadoPagoApi, PaymentStatus> = {
  pendiente: "Pendiente",
  pagado_parcialmente: "Pagado parcialmente",
  pagado: "Pagado",
  reembolsado: "Reembolsado",
};

const PAYMENT_STATUS_TO_ESTADO_PAGO: Record<PaymentStatus, reservasApi.EstadoPagoApi> = {
  Pendiente: "pendiente",
  "Pagado parcialmente": "pagado_parcialmente",
  Pagado: "pagado",
  Reembolsado: "reembolsado",
};

const ASISTENCIA_TO_STATUS: Record<reservasApi.AsistenciaApi, AttendanceStatus> = {
  no_registrado: "No registrado",
  asistio: "Asistió",
  no_asistio: "No asistió",
};

const ATTENDANCE_STATUS_TO_ASISTENCIA: Record<"Asistió" | "No asistió", reservasApi.AsistenciaApi> = {
  Asistió: "asistio",
  "No asistió": "no_asistio",
};

// ── Presentación (avatar, iniciales, fechas) — no viene del backend ────────────

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-violet-100 text-violet-600",
  "bg-cyan-100 text-cyan-600",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsOf(nombre: string | null, apellido: string | null): string {
  const n = (nombre ?? "").trim();
  const a = (apellido ?? "").trim();
  const initials = `${n[0] ?? ""}${a[0] ?? n[1] ?? ""}`.toUpperCase();
  return initials || "??";
}

function formatDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const TIMELINE_TYPE_KEYWORDS: [string, TimelineEventType][] = [
  ["cancel", "error"],
  ["reembolso", "neutral"],
  ["reagend", "info"],
  ["confirm", "success"],
  ["pago", "success"],
  ["asistio", "success"],
  ["no_asisti", "warning"],
  ["asistencia", "info"],
];

function timelineTypeFor(accion: string): TimelineEventType {
  const lower = accion.toLowerCase();
  return TIMELINE_TYPE_KEYWORDS.find(([kw]) => lower.includes(kw))?.[1] ?? "neutral";
}

// ── Mapeo Reserva (backend) → Booking (frontend) ────────────────────────────────

function toBooking(r: reservasApi.ReservaResponseApi): Booking {
  const nombre = r.usuarioNombre ?? "";
  const apellido = r.usuarioApellido ?? "";
  return {
    id: String(r.id),
    code: r.codigo ?? `RES-${r.id}`,
    client: {
      id: r.usuarioId ?? "",
      name: [nombre, apellido].filter(Boolean).join(" ") || "Cliente sin nombre",
      email: r.usuarioCorreo ?? "",
      phone: null, // el backend no expone teléfono de usuario todavía
      initials: initialsOf(r.usuarioNombre, r.usuarioApellido),
      avatarColor: AVATAR_COLORS[hashString(r.usuarioId ?? String(r.id)) % AVATAR_COLORS.length],
    },
    spaceId: String(r.espacioId),
    spaceName: r.espacioTitulo ?? "Espacio",
    date: r.fechaInicio.slice(0, 10),
    dateDisplay: formatDateDisplay(r.fechaInicio),
    startTime: formatTime(r.fechaInicio),
    endTime: formatTime(r.fechaFin),
    timeDisplay: `${formatTime(r.fechaInicio)} - ${formatTime(r.fechaFin)}`,
    pax: null, // el backend no registra número de personas todavía
    total: r.total ?? 0,
    status: ESTADO_TO_STATUS[r.estado],
    paymentStatus: ESTADO_PAGO_TO_STATUS[r.estadoPago],
    attendance: ASISTENCIA_TO_STATUS[r.asistencia],
    createdAt: r.fechaCreacion,
  };
}

function toTimeline(h: reservasApi.ReservaHistorialItemApi): BookingTimeline {
  return {
    id: String(h.id),
    title: h.detalle ?? h.accion,
    date: formatDateDisplay(h.fecha),
    time: formatTime(h.fecha),
    type: timelineTypeFor(h.accion),
  };
}

function toBookingDetail(r: reservasApi.ReservaDetalleResponseApi): BookingDetail {
  const total = r.total ?? 0;
  const paid = r.pagado ?? 0;
  return {
    ...toBooking(r),
    notes: r.notas ?? undefined,
    payment: {
      total,
      paid,
      pending: r.pendiente ?? Math.max(0, total - paid),
      status: ESTADO_PAGO_TO_STATUS[r.estadoPago],
    },
    timeline: (r.historial ?? []).map(toTimeline),
  };
}

async function fetchBookingDetail(id: number, accessToken: string): Promise<BookingDetail> {
  const detalle = await reservasApi.getReservaDetalle(id, accessToken);
  return toBookingDetail(detalle);
}

// ── API pública (misma interfaz que antes usaba BookingService) ────────────────

export async function getStatistics(): Promise<BookingStatistics> {
  const accessToken = await requireAccessToken();
  const [stats, pendientesPage] = await Promise.all([
    reservasApi.getEstadisticas(accessToken),
    reservasApi.listReservas({ estado: "pendiente", page: 0, size: 1 }, accessToken),
  ]);
  return {
    reservasHoy: stats.totalReservasHoy,
    pendientes: pendientesPage.totalElements,
    ingresosDia: stats.ingresosHoy,
    ocupacion: stats.porcentajeOcupacion,
    variacionIngresos: null, // el backend no expone comparativo vs. día anterior todavía
  };
}

export async function getBookings(filters: BookingFilters = {}): Promise<PagedResponse<Booking>> {
  const accessToken = await requireAccessToken();
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 20;

  const sortByMap: Record<string, reservasApi.ListReservasParamsApi["sortBy"]> = {
    date: "fechaInicio",
    status: "estado",
    total: "total",
  };

  // El buscador del front es un solo campo; el backend separa "codigo" y
  // "cliente" como filtros independientes. Se manda solo a "cliente" (nombre/
  // apellido/email) por ser el caso de uso más común — ajustar si el negocio
  // espera que el mismo campo también busque por código de reserva.
  const resp = await reservasApi.listReservas(
    {
      cliente: filters.search || undefined,
      espacioId: filters.spaceId ? Number(filters.spaceId) : undefined,
      estado: filters.status ? STATUS_TO_ESTADO[filters.status] : undefined,
      estadoPago: filters.paymentStatus ? PAYMENT_STATUS_TO_ESTADO_PAGO[filters.paymentStatus] : undefined,
      fechaDesde: filters.dateFrom,
      fechaHasta: filters.dateTo,
      sortBy: filters.sortBy ? sortByMap[filters.sortBy] : undefined,
      sortDir: filters.sortDir,
      page: page - 1,
      size,
    },
    accessToken,
  );

  return {
    items: (resp.content ?? []).map(toBooking),
    total: resp.totalElements,
    page: resp.number + 1,
    pageSize: size,
    totalPages: resp.totalPages,
  };
}

export async function getBookingDetail(id: string): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  return fetchBookingDetail(Number(id), accessToken);
}

export async function confirmBooking(bookingId: string): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  await reservasApi.confirmarReserva(Number(bookingId), accessToken);
  return fetchBookingDetail(Number(bookingId), accessToken);
}

export async function cancelBooking(bookingId: string, reason: string): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  await reservasApi.cancelarReserva(Number(bookingId), reason, accessToken);
  return fetchBookingDetail(Number(bookingId), accessToken);
}

export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  await reservasApi.reagendarReserva(
    Number(bookingId),
    { fechaInicio: `${newDate}T${newStartTime}:00`, fechaFin: `${newDate}T${newEndTime}:00` },
    accessToken,
  );
  return fetchBookingDetail(Number(bookingId), accessToken);
}

export async function registerPayment(
  bookingId: string,
  amount: number,
  type: "partial" | "full" | "refund",
  notes?: string,
): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  const tipo = type === "partial" ? "parcial" : type === "full" ? "total" : "reembolso";
  await reservasApi.registrarPago(Number(bookingId), { monto: amount, tipo, notas: notes }, accessToken);
  return fetchBookingDetail(Number(bookingId), accessToken);
}

export async function registerAttendance(
  bookingId: string,
  status: "Asistió" | "No asistió",
): Promise<BookingDetail> {
  const accessToken = await requireAccessToken();
  await reservasApi.registrarAsistencia(Number(bookingId), ATTENDANCE_STATUS_TO_ASISTENCIA[status], accessToken);
  return fetchBookingDetail(Number(bookingId), accessToken);
}

export async function getSpaceOptions(): Promise<SpaceOption[]> {
  const accessToken = await requireAccessToken();
  const espacios = await getMisEspacios(accessToken);
  return espacios.map((e) => ({ id: String(e.id), nombre: e.titulo ?? "Sin nombre" }));
}
