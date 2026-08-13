import type * as reservasApi from "@/modules/bookings/api/reservas";
import type { EspacioOption } from "@/lib/domain";
import type { Booking, BookingDetail } from "@/modules/bookings";

/**
 * Constructores de datos de prueba.
 *
 * Devuelven la forma **de transporte** (`*Api`, vocabulario del backend en
 * español) o la de **dominio** según el sufijo, respetando el modelo dual
 * descrito en AGENTS.md. Cada builder acepta un `overrides` parcial para que
 * cada prueba exprese solo lo que le importa.
 */

export function espacioOption(overrides: Partial<EspacioOption> = {}): EspacioOption {
  return {
    id: 1,
    nombre: "Cancha Norte",
    tipoEspacioNombre: "Cancha de fútbol",
    modalidadReserva: "franja_exclusiva",
    maxCapacidad: 20,
    validarAforo: false,
    ...overrides,
  };
}

export function reservaApi(
  overrides: Partial<reservasApi.ReservaResponseApi> = {},
): reservasApi.ReservaResponseApi {
  return {
    id: 101,
    codigo: "RES-0101",
    espacioId: 1,
    espacioTitulo: "Cancha Norte",
    cliente: {
      id: "cli-1",
      nombre: "María Fernanda Pérez",
      email: "maria@example.com",
      telefono: "0999999999",
    },
    fechaInicio: "2026-03-10T14:00:00",
    fechaFin: "2026-03-10T16:00:00",
    totalHoras: 2,
    pax: 8,
    estado: "pendiente",
    estadoPago: "pendiente",
    asistencia: "no_registrado",
    pago: { total: 50, pagado: 0, pendiente: 50, fechaUltimoPago: null },
    fechaCreacion: "2026-03-01T09:00:00",
    ...overrides,
  };
}

export function reservaDetalleApi(
  overrides: Partial<reservasApi.ReservaDetalleResponseApi> = {},
): reservasApi.ReservaDetalleResponseApi {
  return {
    ...reservaApi(),
    notas: "Traer balón propio",
    historial: [
      { id: 1, accion: "creada", detalle: "Reserva creada", fecha: "2026-03-01T09:00:00" },
      { id: 2, accion: "confirmada", detalle: null, fecha: "2026-03-02T10:30:00" },
    ],
    ...overrides,
  };
}

export function pagedApi<T>(
  items: T[],
  overrides: Partial<reservasApi.PagedResponseApi<T>> = {},
): reservasApi.PagedResponseApi<T> {
  return {
    items,
    total: items.length,
    page: 0,
    pageSize: 20,
    totalPages: 1,
    ...overrides,
  };
}

export function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "101",
    code: "RES-0101",
    client: {
      id: "cli-1",
      name: "María Fernanda Pérez",
      email: "maria@example.com",
      phone: "0999999999",
      initials: "MF",
      avatarColor: "bg-blue-100 text-blue-600",
    },
    spaceId: 1,
    spaceName: "Cancha Norte",
    date: "2026-03-10",
    dateDisplay: "mar, 10 mar",
    startTime: "14:00",
    endTime: "16:00",
    timeDisplay: "14:00 - 16:00",
    pax: 8,
    total: 50,
    archetype: "franja_exclusiva",
    status: "Pendiente",
    paymentStatus: "Pendiente",
    attendance: "No registrado",
    createdAt: "2026-03-01T09:00:00",
    ...overrides,
  };
}

export function bookingDetail(overrides: Partial<BookingDetail> = {}): BookingDetail {
  return {
    ...booking(),
    payment: { total: 50, paid: 0, pending: 50, status: "Pendiente" },
    timeline: [
      { id: "1", title: "Reserva creada", date: "dom, 1 mar", time: "09:00", type: "neutral" },
    ],
    ...overrides,
  };
}
