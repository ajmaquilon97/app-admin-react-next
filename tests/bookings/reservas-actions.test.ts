/**
 * Server Actions del módulo de reservas (`modules/bookings/actions/reservas.ts`).
 *
 * Aquí vive la **capa anticorrupción** entre el vocabulario del backend
 * (`ReservaResponseApi`, estados en snake_case y español) y el modelo de dominio
 * del portal (`Booking`, estados de presentación). Es el punto donde un renombre
 * del backend debe absorberse sin tocar componentes, así que las pruebas fijan
 * el contrato de mapeo en ambos sentidos: enums, paginación 0-based ↔ 1-based,
 * derivación del arquetipo por espacio y tolerancia a campos nulos.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));

jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/lib/api/espacios-catalogo", () => ({ loadEspacioOptions: jest.fn() }));
jest.mock("@/modules/bookings/api/reservas", () => ({
  listReservas: jest.fn(),
  getEstadisticas: jest.fn(),
  getReservaDetalle: jest.fn(),
  confirmarReserva: jest.fn(),
  cancelarReserva: jest.fn(),
  reagendarReserva: jest.fn(),
  registrarAsistencia: jest.fn(),
  registrarPago: jest.fn(),
  generarPinRecepcion: jest.fn(),
}));

import * as reservasApi from "@/modules/bookings/api/reservas";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import * as actions from "@/modules/bookings/actions/reservas";
import { espacioOption, pagedApi, reservaApi, reservaDetalleApi } from "../helpers/fixtures";

const api = jest.mocked(reservasApi);
const sesion = jest.mocked(getSessionTokens);
const catalogo = jest.mocked(loadEspacioOptions);

const TOKEN = "access-token-de-prueba";

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
  catalogo.mockResolvedValue([
    espacioOption({ id: 1, modalidadReserva: "franja_exclusiva" }),
    espacioOption({ id: 2, nombre: "Piscina", modalidadReserva: "cupo_compartido" }),
  ]);
});

describe("control de sesión", () => {
  /**
   * Toda action del módulo es alcanzable desde el navegador: sin cookie de sesión
   * válida debe cortar antes de tocar el backend, no confiar en el llamante.
   */
  it("redirige al login si no hay sesión, sin llamar al backend", async () => {
    sesion.mockResolvedValue(null);

    await expect(actions.getBookings()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.listReservas).not.toHaveBeenCalled();
  });

  it("nunca acepta el access token como argumento de la action", () => {
    // La firma pública no expone ningún parámetro de credenciales: el token se
    // resuelve dentro, desde la cookie cifrada (ver AGENTS.md → `lib/actions`).
    expect(actions.getBookings.length).toBeLessThanOrEqual(1);
    expect(actions.getBookingDetail.length).toBe(1);
  });
});

describe("getBookings — mapeo de la lista", () => {
  it("traduce estado, estado de pago y asistencia al vocabulario del portal", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([
        reservaApi({
          estado: "confirmada",
          estadoPago: "pagado_parcialmente",
          asistencia: "asistio",
        }),
      ]),
    );

    const { items } = await actions.getBookings();

    expect(items[0]).toMatchObject({
      status: "Confirmada",
      paymentStatus: "Pagado parcialmente",
      attendance: "Asistió",
    });
  });

  it.each([
    ["pendiente", "Pendiente"],
    ["confirmada", "Confirmada"],
    ["reagendada", "Reagendada"],
    ["cancelada", "Cancelada"],
    ["finalizada", "Finalizada"],
  ] as const)("mapea el estado %s → %s", async (estadoApi, esperado) => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ estado: estadoApi })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.status).toBe(esperado);
  });

  it.each([
    ["pendiente", "Pendiente"],
    ["pagado_parcialmente", "Pagado parcialmente"],
    ["pagado", "Pagado"],
    ["reembolsado", "Reembolsado"],
  ] as const)("mapea el estado de pago %s → %s", async (estadoApi, esperado) => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ estadoPago: estadoApi })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.paymentStatus).toBe(esperado);
  });

  it("convierte el id numérico del backend en el id string del dominio", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ id: 4321 })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.id).toBe("4321");
  });

  /** El arquetipo no viene en la reserva: sale del join contra el catálogo de tipos. */
  it("deriva el arquetipo del espacio desde el catálogo", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([reservaApi({ id: 1, espacioId: 1 }), reservaApi({ id: 2, espacioId: 2 })]),
    );

    const { items } = await actions.getBookings();

    expect(items[0]!.archetype).toBe("franja_exclusiva");
    expect(items[1]!.archetype).toBe("cupo_compartido");
  });

  it("cae en franja_exclusiva si el espacio no está en el catálogo", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ espacioId: 999 })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.archetype).toBe("franja_exclusiva");
  });

  it("traduce la paginación 0-based del backend a 1-based para la UI", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([reservaApi()], { page: 2, total: 55, pageSize: 20, totalPages: 3 }),
    );

    const resultado = await actions.getBookings({ page: 3 });

    expect(resultado).toMatchObject({ page: 3, total: 55, pageSize: 20, totalPages: 3 });
    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, size: 20 }),
      TOKEN,
    );
  });

  it("usa página 1 y tamaño 20 por defecto", async () => {
    api.listReservas.mockResolvedValue(pagedApi([]));

    await actions.getBookings();

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 20 }),
      TOKEN,
    );
  });

  it("tolera que el backend devuelva items nulos", async () => {
    api.listReservas.mockResolvedValue(pagedApi<reservasApi.ReservaResponseApi>([], { items: null }));

    await expect(actions.getBookings()).resolves.toMatchObject({ items: [] });
  });

  it("conserva el tamaño solicitado si el backend no lo devuelve", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([], { pageSize: undefined as unknown as number }),
    );

    const resultado = await actions.getBookings({ pageSize: 50 });
    expect(resultado.pageSize).toBe(50);
  });
});

describe("getBookings — traducción de filtros", () => {
  beforeEach(() => api.listReservas.mockResolvedValue(pagedApi([])));

  it("manda el texto de búsqueda al filtro de cliente del backend", async () => {
    await actions.getBookings({ search: "María" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ cliente: "María" }),
      TOKEN,
    );
  });

  it("omite la búsqueda cuando el campo viene vacío", async () => {
    await actions.getBookings({ search: "" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ cliente: undefined }),
      TOKEN,
    );
  });

  it("traduce los estados de la UI al vocabulario del backend", async () => {
    await actions.getBookings({ status: "Cancelada", paymentStatus: "Pagado parcialmente" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "cancelada", estadoPago: "pagado_parcialmente" }),
      TOKEN,
    );
  });

  it("no manda filtros de estado cuando la UI envía la opción vacía", async () => {
    await actions.getBookings({ status: "", paymentStatus: "" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ estado: undefined, estadoPago: undefined }),
      TOKEN,
    );
  });

  it.each([
    ["date", "fechaInicio"],
    ["status", "estado"],
    ["total", "total"],
  ] as const)("traduce el orden por %s → %s", async (sortBy, esperado) => {
    await actions.getBookings({ sortBy, sortDir: "desc" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: esperado, sortDir: "desc" }),
      TOKEN,
    );
  });

  /**
   * "client" es una columna solo del portal (el backend no ordena por cliente):
   * se traduce a `undefined` en vez de mandar un campo que la API rechazaría.
   */
  it("descarta el orden por cliente, que el backend no soporta", async () => {
    await actions.getBookings({ sortBy: "client" });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: undefined }),
      TOKEN,
    );
  });

  it("pasa el rango de fechas y el espacio tal cual", async () => {
    await actions.getBookings({ dateFrom: "2026-03-01", dateTo: "2026-03-31", spaceId: 7 });

    expect(api.listReservas).toHaveBeenCalledWith(
      expect.objectContaining({
        fechaDesde: "2026-03-01",
        fechaHasta: "2026-03-31",
        espacioId: 7,
      }),
      TOKEN,
    );
  });
});

describe("getBookings — datos del cliente", () => {
  it("calcula iniciales a partir del nombre completo", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([
        reservaApi({
          cliente: { id: "c1", nombre: "María Fernanda Pérez", email: "m@e.com", telefono: null },
        }),
      ]),
    );

    const { items } = await actions.getBookings();
    expect(items[0]!.client.initials).toBe("MF");
  });

  it("usa las dos primeras letras cuando solo hay un nombre", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([reservaApi({ cliente: { id: "c1", nombre: "Ana", email: null, telefono: null } })]),
    );

    const { items } = await actions.getBookings();
    expect(items[0]!.client.initials).toBe("AN");
  });

  it("degrada a '??' cuando no hay nombre", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([reservaApi({ cliente: { id: "c1", nombre: null, email: null, telefono: null } })]),
    );

    const { items } = await actions.getBookings();
    expect(items[0]!.client.initials).toBe("??");
    expect(items[0]!.client.name).toBe("Cliente sin nombre");
  });

  it("sobrevive a una reserva sin cliente asociado", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ cliente: null })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.client).toMatchObject({ id: "", name: "Cliente sin nombre", phone: null });
  });

  /** El color de avatar debe ser estable: el mismo cliente no puede cambiar de color al recargar. */
  it("asigna un color de avatar determinista por cliente", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi()]));
    const primera = (await actions.getBookings()).items[0]!.client.avatarColor;

    api.listReservas.mockResolvedValue(pagedApi([reservaApi()]));
    const segunda = (await actions.getBookings()).items[0]!.client.avatarColor;

    expect(primera).toBe(segunda);
    expect(primera).toMatch(/^bg-\w+-100 text-\w+-600$/);
  });
});

describe("getBookings — campos de presentación", () => {
  it("deriva fecha, horas y rango legible de las marcas de tiempo", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([
        reservaApi({ fechaInicio: "2026-03-10T14:00:00", fechaFin: "2026-03-10T16:30:00" }),
      ]),
    );

    const { items } = await actions.getBookings();

    expect(items[0]!.date).toBe("2026-03-10");
    expect(items[0]!.startTime).toBe("14:00");
    expect(items[0]!.endTime).toBe("16:30");
    expect(items[0]!.timeDisplay).toBe("14:00 - 16:30");
  });

  it("sustituye el código ausente por uno derivado del id", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ id: 77, codigo: null })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.code).toBe("RES-77");
  });

  it("muestra 'Espacio' cuando el backend no envía el título", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ espacioTitulo: null })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.spaceName).toBe("Espacio");
  });

  it("toma el total del bloque de pago y usa 0 si no viene", async () => {
    api.listReservas.mockResolvedValue(
      pagedApi([reservaApi({ id: 1, pago: null }), reservaApi({ id: 2 })]),
    );

    const { items } = await actions.getBookings();
    expect(items[0]!.total).toBe(0);
    expect(items[1]!.total).toBe(50);
  });

  it("normaliza pax ausente a null", async () => {
    api.listReservas.mockResolvedValue(pagedApi([reservaApi({ pax: null })]));

    const { items } = await actions.getBookings();
    expect(items[0]!.pax).toBeNull();
  });
});

describe("getBookingDetail", () => {
  it("añade notas, pago detallado y línea de tiempo al modelo base", async () => {
    api.getReservaDetalle.mockResolvedValue(reservaDetalleApi());

    const detalle = await actions.getBookingDetail("101");

    expect(api.getReservaDetalle).toHaveBeenCalledWith(101, TOKEN);
    expect(detalle.notes).toBe("Traer balón propio");
    expect(detalle.payment).toMatchObject({ total: 50, paid: 0, pending: 50, status: "Pendiente" });
    expect(detalle.timeline).toHaveLength(2);
  });

  it("calcula el pendiente si el backend no lo envía", async () => {
    api.getReservaDetalle.mockResolvedValue(
      reservaDetalleApi({
        pago: { total: 80, pagado: 30, pendiente: undefined as unknown as number, fechaUltimoPago: null },
      }),
    );

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.payment.pending).toBe(50);
  });

  it("nunca reporta un pendiente negativo si lo pagado excede el total", async () => {
    api.getReservaDetalle.mockResolvedValue(
      reservaDetalleApi({
        pago: { total: 50, pagado: 80, pendiente: undefined as unknown as number, fechaUltimoPago: null },
      }),
    );

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.payment.pending).toBe(0);
  });

  it("convierte notas nulas en undefined", async () => {
    api.getReservaDetalle.mockResolvedValue(reservaDetalleApi({ notas: null }));

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.notes).toBeUndefined();
  });

  it("tolera un historial nulo", async () => {
    api.getReservaDetalle.mockResolvedValue(reservaDetalleApi({ historial: null }));

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.timeline).toEqual([]);
  });

  it("usa la acción como título cuando el historial no trae detalle", async () => {
    api.getReservaDetalle.mockResolvedValue(
      reservaDetalleApi({
        historial: [{ id: 9, accion: "reagendada", detalle: null, fecha: "2026-03-05T11:00:00" }],
      }),
    );

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.timeline[0]!.title).toBe("reagendada");
  });

  /** El color del punto de la línea de tiempo se infiere de la acción del backend. */
  it.each([
    ["cancelada", "error"],
    ["reembolso_emitido", "neutral"],
    ["reagendada", "info"],
    ["confirmada", "success"],
    ["pago_registrado", "success"],
    ["asistio", "success"],
    ["no_asistio", "warning"],
    ["asistencia_pendiente", "info"],
    ["evento_desconocido", "neutral"],
  ])("clasifica la acción %s como evento %s", async (accion, tipoEsperado) => {
    api.getReservaDetalle.mockResolvedValue(
      reservaDetalleApi({
        historial: [{ id: 1, accion, detalle: null, fecha: "2026-03-05T11:00:00" }],
      }),
    );

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.timeline[0]!.type).toBe(tipoEsperado);
  });

  it("clasifica sin depender de mayúsculas", async () => {
    api.getReservaDetalle.mockResolvedValue(
      reservaDetalleApi({
        historial: [{ id: 1, accion: "RESERVA CANCELADA", detalle: null, fecha: "2026-03-05T11:00:00" }],
      }),
    );

    const detalle = await actions.getBookingDetail("101");
    expect(detalle.timeline[0]!.type).toBe("error");
  });
});

describe("estadísticas", () => {
  it("compone las estadísticas con el conteo real de pendientes", async () => {
    api.getEstadisticas.mockResolvedValue({
      totalReservasHoy: 12,
      ingresosHoy: 340.5,
      pendientesHoy: 4,
      porcentajeOcupacion: 73,
    });
    api.listReservas.mockResolvedValue(pagedApi([], { total: 9 }));

    const stats = await actions.getStatistics();

    // `pendientes` sale de la consulta paginada, no del campo `pendientesHoy`:
    // ese solo cuenta las de hoy y el KPI muestra todas las que esperan confirmación.
    expect(stats).toEqual({
      reservasHoy: 12,
      pendientes: 9,
      ingresosDia: 340.5,
      ocupacion: 73,
      variacionIngresos: null,
    });
    expect(api.listReservas).toHaveBeenCalledWith(
      { estado: "pendiente", page: 0, size: 1 },
      TOKEN,
    );
  });
});

describe("acciones sobre una reserva", () => {
  beforeEach(() => {
    api.getReservaDetalle.mockResolvedValue(reservaDetalleApi());
  });

  it("confirmBooking confirma y devuelve el detalle recargado", async () => {
    api.confirmarReserva.mockResolvedValue(reservaApi());

    const detalle = await actions.confirmBooking("101");

    expect(api.confirmarReserva).toHaveBeenCalledWith(101, TOKEN);
    expect(api.getReservaDetalle).toHaveBeenCalledWith(101, TOKEN);
    expect(detalle.id).toBe("101");
  });

  it("cancelBooking envía el motivo y expone el estado del reverso", async () => {
    api.cancelarReserva.mockResolvedValue({ ...reservaApi(), estadoReverso: "PROCESANDO" });

    const detalle = await actions.cancelBooking("101", "El cliente no podrá asistir");

    expect(api.cancelarReserva).toHaveBeenCalledWith(101, "El cliente no podrá asistir", TOKEN);
    expect(detalle.estadoReverso).toBe("PROCESANDO");
  });

  /** Un reverso fallido debe llegar a la UI para que el anfitrión lo resuelva a mano. */
  it("cancelBooking propaga el fallo del reverso automático", async () => {
    api.cancelarReserva.mockResolvedValue({ ...reservaApi(), estadoReverso: "ERROR" });

    const detalle = await actions.cancelBooking("101", "Cierre imprevisto");
    expect(detalle.estadoReverso).toBe("ERROR");
  });

  it("rescheduleBooking compone las marcas de tiempo ISO que espera el backend", async () => {
    api.reagendarReserva.mockResolvedValue(reservaApi());

    await actions.rescheduleBooking("101", "2026-04-02", "09:00", "11:30");

    expect(api.reagendarReserva).toHaveBeenCalledWith(
      101,
      { fechaInicio: "2026-04-02T09:00:00", fechaFin: "2026-04-02T11:30:00" },
      TOKEN,
    );
  });

  it.each([
    ["partial", "parcial"],
    ["full", "total"],
    ["refund", "reembolso"],
  ] as const)("registerPayment traduce el tipo %s → %s", async (tipoUi, tipoApi) => {
    api.registrarPago.mockResolvedValue(reservaApi());

    await actions.registerPayment("101", 25, tipoUi, "abono en efectivo");

    expect(api.registrarPago).toHaveBeenCalledWith(
      101,
      { monto: 25, tipo: tipoApi, notas: "abono en efectivo" },
      TOKEN,
    );
  });

  it.each([
    ["Asistió", "asistio"],
    ["No asistió", "no_asistio"],
  ] as const)("registerAttendance traduce %s → %s", async (estadoUi, estadoApi) => {
    api.registrarAsistencia.mockResolvedValue(reservaApi());

    await actions.registerAttendance("101", estadoUi);

    expect(api.registrarAsistencia).toHaveBeenCalledWith(101, estadoApi, TOKEN);
  });

  it("generatePinRecepcion devuelve solo el PIN y su expiración", async () => {
    api.generarPinRecepcion.mockResolvedValue({
      pin: "482913",
      fechaExpiracion: "2026-03-10T15:00:00",
    });

    await expect(actions.generatePinRecepcion("101")).resolves.toEqual({
      pin: "482913",
      fechaExpiracion: "2026-03-10T15:00:00",
    });
  });
});
