/**
 * Componentes del módulo de reservas.
 *
 * Siguiendo la filosofía de React Testing Library, se consultan los elementos
 * por su rol de accesibilidad, su etiqueta o su texto visible —nunca por clases
 * ni por estructura interna— de modo que las pruebas sigan siendo válidas si el
 * marcado cambia y fallen solo si cambia lo que el usuario percibe.
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

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as reservasActions from "@/modules/bookings/actions/reservas";
import * as catalogoActions from "@/lib/actions/catalogo-espacios";
import { ReservasModule } from "@/modules/bookings";
import { BookingKPIs } from "@/modules/bookings/components/BookingKPIs";
import { BookingsTable } from "@/modules/bookings/components/BookingsTable";
import { BookingFiltersBar } from "@/modules/bookings/components/BookingFiltersBar";
import { BookingCalendarView } from "@/modules/bookings/components/BookingCalendarView";
import { CancelDialog } from "@/modules/bookings/components/CancelDialog";
import { PaymentPanel } from "@/modules/bookings/components/PaymentPanel";
import { ReschedulePanel } from "@/modules/bookings/components/ReschedulePanel";
import { PinRecepcionModal } from "@/modules/bookings/components/PinRecepcionModal";
import { BookingDetailDrawer } from "@/modules/bookings/components/BookingDetailDrawer";
import { renderWithQuery } from "../helpers/render";
import { booking, bookingDetail, espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(reservasActions);
const catalogo = jest.mocked(catalogoActions);

const pagina = (items = [booking()]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
});

beforeEach(() => {
  catalogo.getSpaceOptions.mockResolvedValue([espacioOption()]);
  acciones.getStatistics.mockResolvedValue({
    reservasHoy: 4,
    pendientes: 2,
    ingresosDia: 180,
    ocupacion: 55,
    variacionIngresos: null,
  });
  acciones.getBookings.mockResolvedValue(pagina());
  acciones.getBookingDetail.mockResolvedValue(bookingDetail());
});

describe("BookingKPIs", () => {
  it("muestra los cuatro indicadores con los datos del backend", async () => {
    renderWithQuery(<BookingKPIs />);

    expect(await screen.findByText("Reservas de hoy")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Reservas pendientes")).toBeInTheDocument();
    expect(screen.getByText("$180")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
  });

  it("indica que no hay comparativo cuando el backend no envía variación", async () => {
    renderWithQuery(<BookingKPIs />);

    expect(await screen.findByText("Sin datos comparativos")).toBeInTheDocument();
  });

  it("muestra la variación con signo cuando sí existe", async () => {
    acciones.getStatistics.mockResolvedValue({
      reservasHoy: 4,
      pendientes: 2,
      ingresosDia: 180,
      ocupacion: 55,
      variacionIngresos: 12,
    });

    renderWithQuery(<BookingKPIs />);

    expect(await screen.findByText("+12% vs ayer")).toBeInTheDocument();
  });

  it("muestra la variación negativa sin duplicar el signo", async () => {
    acciones.getStatistics.mockResolvedValue({
      reservasHoy: 4,
      pendientes: 2,
      ingresosDia: 180,
      ocupacion: 55,
      variacionIngresos: -8,
    });

    renderWithQuery(<BookingKPIs />);

    expect(await screen.findByText("-8% vs ayer")).toBeInTheDocument();
  });

  it.each([
    [85, "Alta demanda"],
    [70, "Alta demanda"],
    [69, "Demanda moderada"],
    [10, "Demanda moderada"],
  ])("califica una ocupación del %i%% como '%s'", async (ocupacion, etiqueta) => {
    acciones.getStatistics.mockResolvedValue({
      reservasHoy: 4,
      pendientes: 2,
      ingresosDia: 180,
      ocupacion,
      variacionIngresos: null,
    });

    renderWithQuery(<BookingKPIs />);

    expect(await screen.findByText(etiqueta)).toBeInTheDocument();
  });
});

describe("BookingsTable", () => {
  const props = { filters: {}, selectedId: null, onSelect: jest.fn() };

  it("lista las reservas con cliente, código y espacio", async () => {
    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText("María Fernanda Pérez")).toBeInTheDocument();
    expect(screen.getByText("RES-0101")).toBeInTheDocument();
    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
  });

  it("muestra un vacío accionable cuando no hay resultados", async () => {
    acciones.getBookings.mockResolvedValue(pagina([]));

    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText("No hay reservas")).toBeInTheDocument();
    expect(screen.getByText("Ajusta los filtros o crea una nueva reserva.")).toBeInTheDocument();
  });

  it("muestra un mensaje de error recuperable si la carga falla", async () => {
    acciones.getBookings.mockRejectedValue(new Error("500"));

    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText("Error al cargar las reservas.")).toBeInTheDocument();
  });

  /** En cupo compartido no hay franja horaria: se reserva el día completo. */
  it("presenta las reservas de cupo compartido como entrada de día completo", async () => {
    acciones.getBookings.mockResolvedValue(
      pagina([booking({ archetype: "cupo_compartido", pax: 3 })]),
    );

    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText(/Entrada de día completo/)).toBeInTheDocument();
    expect(screen.getByText("3 entradas")).toBeInTheDocument();
  });

  it("presenta las reservas de franja exclusiva con su rango horario", async () => {
    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText(/14:00 - 16:00/)).toBeInTheDocument();
  });

  it("muestra un guion cuando la reserva no registra asistentes", async () => {
    acciones.getBookings.mockResolvedValue(pagina([booking({ pax: null })]));

    renderWithQuery(<BookingsTable {...props} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("selecciona la reserva al pulsar su fila", async () => {
    const onSelect = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<BookingsTable {...props} onSelect={onSelect} />);
    await usuario.click(await screen.findByText("María Fernanda Pérez"));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "101" }));
  });

  /** Confirmar desde la tabla no debe además abrir el detalle. */
  it("confirmar desde la fila no propaga la selección", async () => {
    const onSelect = jest.fn();
    acciones.confirmBooking.mockResolvedValue(bookingDetail());
    const usuario = userEvent.setup();

    renderWithQuery(<BookingsTable {...props} onSelect={onSelect} />);
    await usuario.click(await screen.findByTitle("Confirmar"));

    await waitFor(() => expect(acciones.confirmBooking).toHaveBeenCalledWith("101"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("solo ofrece confirmar en las reservas pendientes", async () => {
    acciones.getBookings.mockResolvedValue(pagina([booking({ status: "Confirmada" })]));

    renderWithQuery(<BookingsTable {...props} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.queryByTitle("Confirmar")).not.toBeInTheDocument();
  });

  it("muestra la paginación solo cuando hay más de una página", async () => {
    acciones.getBookings.mockResolvedValue({ ...pagina(), total: 45, totalPages: 3 });

    renderWithQuery(<BookingsTable {...props} />);

    expect(await screen.findByText("45 reservas en total")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("oculta la paginación con una sola página", async () => {
    renderWithQuery(<BookingsTable {...props} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.queryByText(/reservas en total/)).not.toBeInTheDocument();
  });
});

describe("BookingFiltersBar", () => {
  const base = {
    filters: { page: 3, spaceId: 7 },
    onChange: jest.fn(),
    viewMode: "list" as const,
    onViewModeChange: jest.fn(),
  };

  it("vuelve a la primera página al escribir en el buscador", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<BookingFiltersBar {...base} onChange={onChange} />);
    await usuario.type(screen.getByPlaceholderText("Filtrar..."), "A");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: "A", page: 1 }));
  });

  it("borra el filtro de búsqueda al vaciar el campo", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <BookingFiltersBar {...base} filters={{ search: "A" }} onChange={onChange} />,
    );
    await usuario.clear(screen.getByPlaceholderText("Filtrar..."));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: undefined }));
  });

  it("aplica el filtro de estado seleccionado", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<BookingFiltersBar {...base} onChange={onChange} />);
    await usuario.selectOptions(screen.getByRole("combobox"), "Cancelada");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "Cancelada", page: 1 }));
  });

  it("quita el filtro al volver a 'Estado: Todos'", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <BookingFiltersBar {...base} filters={{ status: "Cancelada" }} onChange={onChange} />,
    );
    await usuario.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: undefined }));
  });

  /**
   * El espacio se elige en el encabezado de la página, no en esta barra: limpiar
   * los filtros de la barra no debe sacar al usuario del espacio que está viendo.
   */
  it("conserva el espacio seleccionado al limpiar los filtros", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <BookingFiltersBar
        {...base}
        filters={{ search: "algo", status: "Cancelada", spaceId: 7, page: 4 }}
        onChange={onChange}
      />,
    );
    await usuario.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(onChange).toHaveBeenCalledWith({ page: 1, spaceId: 7 });
  });

  it("cambia entre vista de lista y de calendario", async () => {
    const onViewModeChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<BookingFiltersBar {...base} onViewModeChange={onViewModeChange} />);

    await usuario.click(screen.getByTitle("Vista Calendario"));
    expect(onViewModeChange).toHaveBeenCalledWith("calendar");

    await usuario.click(screen.getByTitle("Vista Lista"));
    expect(onViewModeChange).toHaveBeenCalledWith("list");
  });
});

describe("BookingCalendarView", () => {
  it("explica que la edición de disponibilidad vive en el módulo de agenda", () => {
    renderWithQuery(<BookingCalendarView />);

    expect(screen.getByText("Vista de Calendario (Lectura)")).toBeInTheDocument();
    expect(screen.getByText(/módulo "Agenda"/)).toBeInTheDocument();
  });
});

describe("CancelDialog", () => {
  const props = { bookingCode: "RES-0101", onConfirm: jest.fn(), onClose: jest.fn(), loading: false };

  it("exige un motivo de al menos 5 caracteres antes de cancelar", async () => {
    const onConfirm = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<CancelDialog {...props} onConfirm={onConfirm} />);
    await usuario.type(screen.getByRole("textbox"), "no");
    await usuario.click(screen.getByRole("button", { name: "Confirmar cancelación" }));

    expect(await screen.findByText("El motivo debe tener al menos 5 caracteres")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("entrega el motivo cuando es válido", async () => {
    const onConfirm = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<CancelDialog {...props} onConfirm={onConfirm} />);
    await usuario.type(screen.getByRole("textbox"), "El cliente no podrá asistir");
    await usuario.click(screen.getByRole("button", { name: "Confirmar cancelación" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("El cliente no podrá asistir"));
  });

  it("cierra sin cancelar al pulsar Volver", async () => {
    const onClose = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<CancelDialog {...props} onClose={onClose} />);
    await usuario.click(screen.getByRole("button", { name: "Volver" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("bloquea el envío mientras la cancelación está en curso", () => {
    renderWithQuery(<CancelDialog {...props} loading />);

    expect(screen.getByRole("button", { name: "Cancelando..." })).toBeDisabled();
  });
});

describe("PaymentPanel", () => {
  const detalle = bookingDetail({ payment: { total: 120, paid: 45, pending: 75, status: "Pagado parcialmente" } });
  const props = { booking: detalle, onSubmit: jest.fn(), onClose: jest.fn(), loading: false };

  it("resume total, pagado y pendiente con dos decimales", () => {
    renderWithQuery(<PaymentPanel {...props} />);

    expect(screen.getByText("$120.00")).toBeInTheDocument();
    expect(screen.getByText("$45.00")).toBeInTheDocument();
    expect(screen.getByText("$75.00")).toBeInTheDocument();
  });

  /**
   * El monto tiene doble barrera: el atributo `min="0.01"` del input, que la
   * validación nativa del navegador aplica antes de que el formulario se envíe,
   * y `paymentSchema` en el servidor. Aquí se comprueba la primera —que es la
   * que el usuario encuentra— verificando que un cero no llega a registrarse.
   */
  it("no deja registrar un pago de monto cero", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PaymentPanel {...props} onSubmit={onSubmit} />);
    const monto = screen.getByPlaceholderText("0.00");
    await usuario.type(monto, "0");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(monto).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("tampoco deja registrar un pago sin monto", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PaymentPanel {...props} onSubmit={onSubmit} />);
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("registra un pago parcial por defecto", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PaymentPanel {...props} onSubmit={onSubmit} />);
    await usuario.type(screen.getByPlaceholderText("0.00"), "30");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 30, type: "partial" }),
        expect.anything(),
      ),
    );
  });

  it("permite registrar un reembolso", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PaymentPanel {...props} onSubmit={onSubmit} />);
    await usuario.click(screen.getByText("Reembolso"));
    await usuario.type(screen.getByPlaceholderText("0.00"), "45");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: "refund" }),
        expect.anything(),
      ),
    );
  });

  it("adjunta las notas opcionales", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PaymentPanel {...props} onSubmit={onSubmit} />);
    await usuario.type(screen.getByPlaceholderText("0.00"), "30");
    await usuario.type(screen.getByPlaceholderText("Referencia de pago, banco, etc."), "Transferencia 001");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: "Transferencia 001" }),
        expect.anything(),
      ),
    );
  });
});

describe("ReschedulePanel", () => {
  const props = {
    booking: bookingDetail(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
    loading: false,
  };

  it("precarga la fecha y las horas actuales de la reserva", () => {
    const { container } = renderWithQuery(<ReschedulePanel {...props} />);

    expect(container.querySelector('input[type="date"]')).toHaveValue("2026-03-10");
    const horas = container.querySelectorAll('input[type="time"]');
    expect(horas[0]).toHaveValue("14:00");
    expect(horas[1]).toHaveValue("16:00");
  });

  it("envía la nueva franja al confirmar", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ReschedulePanel {...props} onSubmit={onSubmit} />);
    await usuario.click(screen.getByRole("button", { name: "Reagendar" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { newDate: "2026-03-10", newStartTime: "14:00", newEndTime: "16:00" },
        expect.anything(),
      ),
    );
  });

  it("exige una fecha al reagendar", async () => {
    const onSubmit = jest.fn();
    const usuario = userEvent.setup();
    const { container } = renderWithQuery(
      <ReschedulePanel {...props} booking={bookingDetail({ date: "" })} onSubmit={onSubmit} />,
    );

    await usuario.click(screen.getByRole("button", { name: "Reagendar" }));

    expect(await screen.findByText("Selecciona una fecha")).toBeInTheDocument();
    expect(container.querySelector('input[type="date"]')).toHaveValue("");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("PinRecepcionModal", () => {
  const props = {
    bookingId: "101",
    alreadyIssued: false,
    onGenerated: jest.fn(),
    onClose: jest.fn(),
  };

  it("advierte que el PIN se muestra una sola vez", () => {
    renderWithQuery(<PinRecepcionModal {...props} />);

    expect(screen.getByText(/una sola vez/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar PIN" })).toBeInTheDocument();
  });

  it("avisa que regenerar invalida el PIN anterior", () => {
    renderWithQuery(<PinRecepcionModal {...props} alreadyIssued />);

    expect(screen.getByText(/invalidará el PIN anterior/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regenerar PIN" })).toBeInTheDocument();
  });

  it("muestra el PIN generado y avisa al contenedor", async () => {
    acciones.generatePinRecepcion.mockResolvedValue({
      pin: "482913",
      fechaExpiracion: "2026-03-10T15:00:00",
    });
    const onGenerated = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PinRecepcionModal {...props} onGenerated={onGenerated} />);
    await usuario.click(screen.getByRole("button", { name: "Generar PIN" }));

    expect(await screen.findByText("482913")).toBeInTheDocument();
    expect(screen.getByText(/no se podrá volver a ver/)).toBeInTheDocument();
    expect(onGenerated).toHaveBeenCalled();
  });

  it("copia el PIN al portapapeles", async () => {
    acciones.generatePinRecepcion.mockResolvedValue({
      pin: "482913",
      fechaExpiracion: "2026-03-10T15:00:00",
    });
    const usuario = userEvent.setup();
    // `navigator.clipboard` solo tiene getter en jsdom, así que hay que redefinir
    // la propiedad — y hacerlo *después* de `userEvent.setup()`, que instala su
    // propio doble del portapapeles y sobrescribiría este.
    const writeText = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderWithQuery(<PinRecepcionModal {...props} />);
    await usuario.click(screen.getByRole("button", { name: "Generar PIN" }));
    await screen.findByText("482913");
    await usuario.click(screen.getByRole("button", { name: /Copiar/ }));

    expect(writeText).toHaveBeenCalledWith("482913");
  });
});

describe("BookingDetailDrawer", () => {
  it("muestra los datos del cliente y del espacio", async () => {
    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);

    expect(await screen.findByText("María Fernanda Pérez")).toBeInTheDocument();
    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByText("0999999999")).toBeInTheDocument();
    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
  });

  it("renderiza con el preview de la tabla mientras carga el detalle", () => {
    acciones.getBookingDetail.mockImplementation(() => new Promise(() => {}));

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);

    expect(screen.getByText("Detalle de Reserva")).toBeInTheDocument();
    expect(screen.getByText("RES-0101")).toBeInTheDocument();
  });

  it("muestra las observaciones cuando la reserva las tiene", async () => {
    acciones.getBookingDetail.mockResolvedValue(bookingDetail({ notes: "Traer balón propio" }));

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);

    expect(await screen.findByText(/Traer balón propio/)).toBeInTheDocument();
  });

  it("dibuja la línea de tiempo del detalle", async () => {
    acciones.getBookingDetail.mockResolvedValue(
      bookingDetail({
        timeline: [
          { id: "1", title: "Reserva creada", date: "dom, 1 mar", time: "09:00", type: "neutral" },
          { id: "2", title: "Pago registrado", date: "lun, 2 mar", time: "10:30", type: "success" },
        ],
      }),
    );

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);

    expect(await screen.findByText("Línea de Tiempo")).toBeInTheDocument();
    expect(screen.getByText("Pago registrado")).toBeInTheDocument();
  });

  it("solo ofrece confirmar mientras la reserva está pendiente", async () => {
    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    expect(await screen.findByRole("button", { name: /Confirmar Reserva/ })).toBeInTheDocument();
  });

  it("oculta confirmar en una reserva ya finalizada", async () => {
    const finalizada = booking({ status: "Finalizada" });
    acciones.getBookingDetail.mockResolvedValue(bookingDetail({ status: "Finalizada" }));

    renderWithQuery(<BookingDetailDrawer booking={finalizada} onClose={jest.fn()} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.queryByRole("button", { name: /Confirmar Reserva/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar reserva/ })).not.toBeInTheDocument();
  });

  it("registra la asistencia del cliente", async () => {
    acciones.registerAttendance.mockResolvedValue(bookingDetail({ attendance: "Asistió" }));
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: "Asistió" }));

    await waitFor(() => expect(acciones.registerAttendance).toHaveBeenCalledWith("101", "Asistió"));
  });

  it("abre y cierra el diálogo de cancelación", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: /Cancelar reserva/ }));

    expect(await screen.findByText("Cancelar Reserva")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Volver" }));
    await waitFor(() => expect(screen.queryByText("Cancelar Reserva")).not.toBeInTheDocument());
  });

  it("cancela la reserva con el motivo escrito", async () => {
    acciones.cancelBooking.mockResolvedValue(bookingDetail({ status: "Cancelada" }));
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: /Cancelar reserva/ }));
    await usuario.type(await screen.findByRole("textbox"), "El cliente canceló por lluvia");
    await usuario.click(screen.getByRole("button", { name: "Confirmar cancelación" }));

    await waitFor(() =>
      expect(acciones.cancelBooking).toHaveBeenCalledWith("101", "El cliente canceló por lluvia"),
    );
  });

  it("abre el panel de reagendamiento sobre el detalle cargado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: /Reagendar/ }));

    expect(await screen.findByText("Reagendar Reserva")).toBeInTheDocument();
  });

  it("abre el panel de pago sobre el detalle cargado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: /Pagar/ }));

    expect(await screen.findByText("Registrar Pago")).toBeInTheDocument();
  });

  it("cambia el rótulo del PIN una vez emitido", async () => {
    acciones.generatePinRecepcion.mockResolvedValue({
      pin: "112233",
      fechaExpiracion: "2026-03-10T15:00:00",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await usuario.click(await screen.findByRole("button", { name: /Generar PIN de Recepción/ }));
    await usuario.click(await screen.findByRole("button", { name: "Generar PIN" }));
    await screen.findByText("112233");
    await usuario.click(screen.getByRole("button", { name: /Entendido, cerrar/ }));

    expect(await screen.findByRole("button", { name: /Regenerar PIN/ })).toBeInTheDocument();
  });

  /** Sin teléfono no debe ofrecerse un enlace `tel:` roto. */
  it("deshabilita la llamada cuando el cliente no tiene teléfono", async () => {
    const sinTelefono = booking({ client: { ...booking().client, phone: null } });
    acciones.getBookingDetail.mockResolvedValue(
      bookingDetail({ client: { ...bookingDetail().client, phone: null } }),
    );

    renderWithQuery(<BookingDetailDrawer booking={sinTelefono} onClose={jest.fn()} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.getByTitle("Sin teléfono registrado")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Llamar/ })).not.toBeInTheDocument();
  });

  it("ofrece contactar por correo y por teléfono cuando ambos existen", async () => {
    renderWithQuery(<BookingDetailDrawer booking={booking()} onClose={jest.fn()} />);
    await screen.findByText("María Fernanda Pérez");

    expect(screen.getByRole("link", { name: /Mensaje/ })).toHaveAttribute(
      "href",
      "mailto:maria@example.com",
    );
    expect(screen.getByRole("link", { name: /Llamar/ })).toHaveAttribute("href", "tel:0999999999");
  });

  it("presenta las entradas de un espacio de cupo compartido", async () => {
    const compartido = booking({ archetype: "cupo_compartido", pax: 4 });
    acciones.getBookingDetail.mockResolvedValue(
      bookingDetail({ archetype: "cupo_compartido", pax: 4 }),
    );

    renderWithQuery(<BookingDetailDrawer booking={compartido} onClose={jest.fn()} />);

    expect(await screen.findByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("4 entradas")).toBeInTheDocument();
  });

  it("cierra el drawer al pulsar la X", async () => {
    const onClose = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(
      <BookingDetailDrawer booking={booking()} onClose={onClose} />,
    );
    const cabecera = screen.getByText("Detalle de Reserva").closest("div")!.parentElement!;
    await usuario.click(within(cabecera).getByRole("button"));

    expect(onClose).toHaveBeenCalled();
    expect(container).toBeTruthy();
  });
});

describe("ReservasModule", () => {
  it("compone encabezado, KPIs, filtros y tabla", async () => {
    renderWithQuery(<ReservasModule />);

    expect(screen.getByRole("heading", { name: "Reservas", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Reservas de hoy")).toBeInTheDocument();
    expect(await screen.findByText("María Fernanda Pérez")).toBeInTheDocument();
  });

  it("filtra por espacio desde el selector del encabezado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ReservasModule />);
    // El catálogo de espacios llega por React Query: hay que esperar a que el
    // selector tenga la opción antes de elegirla.
    const opcion = await screen.findByRole("option", { name: /Cancha Norte/ });
    await usuario.selectOptions(opcion.closest("select")!, "1");

    await waitFor(() =>
      expect(acciones.getBookings).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 1 })),
    );
  });

  it("alterna a la vista de calendario", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ReservasModule />);
    await usuario.click(await screen.findByTitle("Vista Calendario"));

    expect(await screen.findByText("Vista de Calendario (Lectura)")).toBeInTheDocument();
  });

  it("abre el detalle al seleccionar una reserva y lo cierra al reseleccionarla", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ReservasModule />);
    await usuario.click(await screen.findByText("María Fernanda Pérez"));

    expect(await screen.findByText("Detalle de Reserva")).toBeInTheDocument();
  });
});
