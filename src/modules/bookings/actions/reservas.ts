"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/auth/session";
import * as reservasApi from "../api/reservas";
import { getMisEspacios, getTiposEspacios } from "@/lib/api/spaces";
import { getArchetype, type EspacioArchetype } from "@/lib/domain";
import type {
  Booking,
  BookingDetail,
  BookingFilters,
  BookingStatistics,
  BookingTimeline,
  PagedResponse,
  EspacioOption,
  BookingStatus,
  PaymentStatus,
  AttendanceStatus,
  TimelineEventType,
  PinRecepcion,
} from "../types";

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

function initialsOf(fullName: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`.toUpperCase();
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

// ── Archetype por espacio (franja exclusiva vs. cupo compartido) ───────────────
// El backend todavía no expone esto en la reserva — se resuelve con un join
// contra el catálogo de tipos de espacio (ver espacio-archetype.ts).

async function buildArchetypeMap(accessToken: string): Promise<Map<number, EspacioArchetype>> {
  const [espacios, tipos] = await Promise.all([getMisEspacios(accessToken), getTiposEspacios()]);
  const modalidadPorTipoId = new Map(tipos.map((t) => [t.id, t.modalidadReserva]));
  return new Map(
    espacios.map((e) => [e.id, getArchetype({ modalidadReserva: modalidadPorTipoId.get(e.tipoEspacioId) ?? null })]),
  );
}

// ── Mapeo Reserva (backend) → Booking (frontend) ────────────────────────────────

function toBooking(r: reservasApi.ReservaResponseApi, archetypeMap: Map<number, EspacioArchetype>): Booking {
  const clienteNombre = r.cliente?.nombre ?? "";
  return {
    id: String(r.id),
    code: r.codigo ?? `RES-${r.id}`,
    client: {
      id: r.cliente?.id ?? "",
      name: clienteNombre || "Cliente sin nombre",
      email: r.cliente?.email ?? "",
      phone: r.cliente?.telefono ?? null,
      initials: initialsOf(clienteNombre),
      avatarColor: AVATAR_COLORS[hashString(r.cliente?.id ?? String(r.id)) % AVATAR_COLORS.length],
    },
    spaceId: r.espacioId,
    spaceName: r.espacioTitulo ?? "Espacio",
    date: r.fechaInicio.slice(0, 10),
    dateDisplay: formatDateDisplay(r.fechaInicio),
    startTime: formatTime(r.fechaInicio),
    endTime: formatTime(r.fechaFin),
    timeDisplay: `${formatTime(r.fechaInicio)} - ${formatTime(r.fechaFin)}`,
    pax: r.pax ?? null,
    total: r.pago?.total ?? 0,
    archetype: archetypeMap.get(r.espacioId) ?? "franja_exclusiva",
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

function toBookingDetail(
  r: reservasApi.ReservaDetalleResponseApi,
  archetypeMap: Map<number, EspacioArchetype>,
): BookingDetail {
  const total = r.pago?.total ?? 0;
  const paid = r.pago?.pagado ?? 0;
  return {
    ...toBooking(r, archetypeMap),
    notes: r.notas ?? undefined,
    payment: {
      total,
      paid,
      pending: r.pago?.pendiente ?? Math.max(0, total - paid),
      status: ESTADO_PAGO_TO_STATUS[r.estadoPago],
    },
    timeline: (r.historial ?? []).map(toTimeline),
  };
}

async function fetchBookingDetail(id: number, accessToken: string): Promise<BookingDetail> {
  const [detalle, archetypeMap] = await Promise.all([
    reservasApi.getReservaDetalle(id, accessToken),
    buildArchetypeMap(accessToken),
  ]);
  return toBookingDetail(detalle, archetypeMap);
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
    pendientes: pendientesPage.total,
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
  const [resp, archetypeMap] = await Promise.all([
    reservasApi.listReservas(
      {
        cliente: filters.search || undefined,
        espacioId: filters.spaceId,
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
    ),
    buildArchetypeMap(accessToken),
  ]);

  return {
    items: (resp.items ?? []).map((r) => toBooking(r, archetypeMap)),
    total: resp.total,
    page: resp.page + 1,
    pageSize: resp.pageSize ?? size,
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
  const cancelacion = await reservasApi.cancelarReserva(Number(bookingId), reason, accessToken);
  const detalle = await fetchBookingDetail(Number(bookingId), accessToken);
  return { ...detalle, estadoReverso: cancelacion.estadoReverso };
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

export async function generatePinRecepcion(bookingId: string): Promise<PinRecepcion> {
  const accessToken = await requireAccessToken();
  const { pin, fechaExpiracion } = await reservasApi.generarPinRecepcion(Number(bookingId), accessToken);
  return { pin, fechaExpiracion };
}

