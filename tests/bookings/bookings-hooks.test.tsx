/**
 * Hooks de React Query del módulo de reservas.
 *
 * Encapsulan dos responsabilidades que la UI da por hechas: qué claves de caché
 * se invalidan tras cada mutación —una confirmación debe refrescar también la
 * agenda de disponibilidad— y qué avisos ve el anfitrión. Se prueban con un
 * `QueryClient` aislado por caso.
 */

jest.mock("@/modules/bookings/actions/reservas", () => ({
  getBookings: jest.fn(),
  getStatistics: jest.fn(),
  getBookingDetail: jest.fn(),
  confirmBooking: jest.fn(),
  cancelBooking: jest.fn(),
  rescheduleBooking: jest.fn(),
  registerPayment: jest.fn(),
  registerAttendance: jest.fn(),
  generatePinRecepcion: jest.fn(),
}));
jest.mock("@/lib/actions/catalogo-espacios", () => ({ getSpaceOptions: jest.fn() }));

import { waitFor } from "@testing-library/react";
import { toast } from "sonner";
import * as reservasActions from "@/modules/bookings/actions/reservas";
import * as catalogoActions from "@/lib/actions/catalogo-espacios";
import { bookingKeys } from "@/modules/bookings/constants";
import { useBookings, useBookingStatistics, useSpaces } from "@/modules/bookings/hooks/useBookings";
import { useBookingDetail } from "@/modules/bookings/hooks/useBookingDetail";
import {
  useConfirmBooking,
  useCancelBooking,
  useRescheduleBooking,
  useRegisterPayment,
  useRegisterAttendance,
  useGeneratePinRecepcion,
} from "@/modules/bookings/hooks/useBookingActions";
import { createTestQueryClient, renderHookWithQuery } from "../helpers/render";
import { booking, bookingDetail, espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(reservasActions);
const catalogo = jest.mocked(catalogoActions);
const avisos = jest.mocked(toast);

describe("bookingKeys", () => {
  it("agrupa todas las consultas bajo el mismo prefijo invalidable", () => {
    expect(bookingKeys.all).toEqual(["bookings"]);
    expect(bookingKeys.list({ page: 1 })[0]).toBe("bookings");
    expect(bookingKeys.detail("1")).toEqual(["bookings", "detail", "1"]);
    expect(bookingKeys.statistics).toEqual(["bookings", "statistics"]);
  });

  it("distingue listas con filtros distintos", () => {
    expect(bookingKeys.list({ page: 1 })).not.toEqual(bookingKeys.list({ page: 2 }));
  });
});

describe("useBookings", () => {
  it("consulta la lista con los filtros recibidos", async () => {
    acciones.getBookings.mockResolvedValue({
      items: [booking()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const { result } = renderHookWithQuery(() => useBookings({ status: "Pendiente" }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.getBookings).toHaveBeenCalledWith({ status: "Pendiente" });
    expect(result.current.data?.items).toHaveLength(1);
  });

  it("expone el estado de error sin lanzar", async () => {
    acciones.getBookings.mockRejectedValue(new Error("backend caído"));

    const { result } = renderHookWithQuery(() => useBookings());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useBookingStatistics", () => {
  it("carga las estadísticas del encabezado", async () => {
    acciones.getStatistics.mockResolvedValue({
      reservasHoy: 5,
      pendientes: 2,
      ingresosDia: 120,
      ocupacion: 60,
      variacionIngresos: null,
    });

    const { result } = renderHookWithQuery(() => useBookingStatistics());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.reservasHoy).toBe(5);
  });
});

describe("useSpaces", () => {
  it("lee el catálogo compartido de espacios", async () => {
    catalogo.getSpaceOptions.mockResolvedValue([espacioOption()]);

    const { result } = renderHookWithQuery(() => useSpaces());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe("useBookingDetail", () => {
  it("no consulta mientras no haya una reserva seleccionada", () => {
    const { result } = renderHookWithQuery(() => useBookingDetail(null));

    expect(result.current.fetchStatus).toBe("idle");
    expect(acciones.getBookingDetail).not.toHaveBeenCalled();
  });

  it("consulta el detalle cuando llega un id", async () => {
    acciones.getBookingDetail.mockResolvedValue(bookingDetail());

    const { result } = renderHookWithQuery(() => useBookingDetail("101"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.getBookingDetail).toHaveBeenCalledWith("101");
  });
});

describe("mutaciones — invalidación de caché y avisos", () => {
  /**
   * Confirmar, cancelar o reagendar cambia la ocupación del espacio: si no se
   * invalida `["availability"]`, la agenda sigue mostrando el horario como libre.
   */
  it("useConfirmBooking refresca detalle, lista, estadísticas y agenda", async () => {
    const detalle = bookingDetail({ id: "101" });
    acciones.confirmBooking.mockResolvedValue(detalle);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useConfirmBooking(), { client });

    result.current.mutate({ bookingId: "101" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const clavesInvalidadas = invalidar.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey));
    expect(clavesInvalidadas).toEqual(
      expect.arrayContaining([
        JSON.stringify(bookingKeys.detail("101")),
        JSON.stringify(bookingKeys.all),
        JSON.stringify(bookingKeys.statistics),
        JSON.stringify(["availability"]),
      ]),
    );
    expect(avisos.success).toHaveBeenCalledWith("Reserva confirmada exitosamente");
  });

  /**
   * El detalle recién devuelto se siembra en caché para que el drawer lo muestre
   * sin esperar al refetch. Se observa `setQueryData` en vez de leer la caché
   * después: la invalidación posterior, con `gcTime: 0` en el cliente de prueba,
   * descarta la entrada al no quedarle observadores.
   */
  it("useConfirmBooking siembra la caché del detalle con la respuesta", async () => {
    const detalle = bookingDetail({ id: "101", status: "Confirmada" });
    acciones.confirmBooking.mockResolvedValue(detalle);

    const client = createTestQueryClient();
    const sembrar = jest.spyOn(client, "setQueryData");
    const { result } = renderHookWithQuery(() => useConfirmBooking(), { client });

    result.current.mutate({ bookingId: "101" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sembrar).toHaveBeenCalledWith(bookingKeys.detail("101"), detalle);
  });

  it("useConfirmBooking muestra el mensaje del error, no un genérico", async () => {
    acciones.confirmBooking.mockRejectedValue(new Error("La reserva ya fue cancelada"));

    const { result } = renderHookWithQuery(() => useConfirmBooking());

    result.current.mutate({ bookingId: "101" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(avisos.error).toHaveBeenCalledWith("La reserva ya fue cancelada");
  });

  it("useCancelBooking avisa del éxito sin alarmar si el reverso va bien", async () => {
    acciones.cancelBooking.mockResolvedValue(bookingDetail({ estadoReverso: "PROCESANDO" }));

    const { result } = renderHookWithQuery(() => useCancelBooking());

    result.current.mutate({ bookingId: "101", reason: "El cliente no asistirá" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(avisos.success).toHaveBeenCalledWith("Reserva cancelada");
    expect(avisos.warning).not.toHaveBeenCalled();
  });

  /**
   * Si la nota de crédito automática falla, el dinero queda sin devolver: el
   * anfitrión tiene que enterarse en el momento para resolverlo a mano.
   */
  it("useCancelBooking advierte cuando el reverso automático falla", async () => {
    acciones.cancelBooking.mockResolvedValue(bookingDetail({ estadoReverso: "ERROR" }));

    const { result } = renderHookWithQuery(() => useCancelBooking());

    result.current.mutate({ bookingId: "101", reason: "Cierre imprevisto" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(avisos.warning).toHaveBeenCalledWith(
      "El reverso automático (nota de crédito) falló — requiere resolución manual.",
    );
  });

  it("useRescheduleBooking envía la nueva franja y confirma", async () => {
    acciones.rescheduleBooking.mockResolvedValue(bookingDetail());

    const { result } = renderHookWithQuery(() => useRescheduleBooking());

    result.current.mutate({
      bookingId: "101",
      newDate: "2026-04-02",
      newStartTime: "09:00",
      newEndTime: "11:00",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.rescheduleBooking).toHaveBeenCalledWith("101", "2026-04-02", "09:00", "11:00");
    expect(avisos.success).toHaveBeenCalledWith("Reserva reagendada exitosamente");
  });

  it("useRegisterPayment pasa monto, tipo y notas", async () => {
    acciones.registerPayment.mockResolvedValue(bookingDetail());

    const { result } = renderHookWithQuery(() => useRegisterPayment());

    result.current.mutate({ bookingId: "101", amount: 25, type: "partial", notes: "efectivo" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.registerPayment).toHaveBeenCalledWith("101", 25, "partial", "efectivo");
    expect(avisos.success).toHaveBeenCalledWith("Pago registrado exitosamente");
  });

  it("useRegisterAttendance nombra el estado registrado en el aviso", async () => {
    acciones.registerAttendance.mockResolvedValue(bookingDetail({ attendance: "Asistió" }));

    const { result } = renderHookWithQuery(() => useRegisterAttendance());

    result.current.mutate({ bookingId: "101", status: "Asistió" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(avisos.success).toHaveBeenCalledWith("Asistencia registrada: Asistió");
  });

  it("useGeneratePinRecepcion devuelve el PIN sin tocar la caché de reservas", async () => {
    acciones.generatePinRecepcion.mockResolvedValue({
      pin: "482913",
      fechaExpiracion: "2026-03-10T15:00:00",
    });

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useGeneratePinRecepcion(), { client });

    result.current.mutate({ bookingId: "101" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pin).toBe("482913");
    expect(invalidar).not.toHaveBeenCalled();
  });

  it("useGeneratePinRecepcion reporta el fallo al anfitrión", async () => {
    acciones.generatePinRecepcion.mockRejectedValue(new Error("No se pudo generar el PIN"));

    const { result } = renderHookWithQuery(() => useGeneratePinRecepcion());

    result.current.mutate({ bookingId: "101" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(avisos.error).toHaveBeenCalledWith("No se pudo generar el PIN");
  });
});
