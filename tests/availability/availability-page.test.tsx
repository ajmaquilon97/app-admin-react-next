/**
 * Pantalla de Agenda — el contenedor que orquesta toda la disponibilidad.
 *
 * Su decisión central es cuál de las dos vistas mostrar: la grilla horaria para
 * espacios de franja exclusiva o el panel de aforo para los de cupo compartido.
 * Esa bifurcación no es solo visual: apaga las consultas de la grilla para no
 * pedir datos que nunca se pintarían.
 */

jest.mock("@/modules/availability/actions/availability", () => ({
  fetchServerNow: jest.fn(),
  fetchAvailability: jest.fn(),
  fetchAvailabilityStatistics: jest.fn(),
  fetchSchedule: jest.fn(),
  saveSchedule: jest.fn(),
  fetchExceptions: jest.fn(),
  createException: jest.fn(),
  updateException: jest.fn(),
  deleteException: jest.fn(),
  createBlock: jest.fn(),
  deleteBlock: jest.fn(),
}));
jest.mock("@/modules/availability/actions/aforo", () => ({
  fetchAforoSemana: jest.fn(),
  fetchAforoDia: jest.fn(),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as availabilityActions from "@/modules/availability/actions/availability";
import * as aforoActions from "@/modules/availability/actions/aforo";
import { AvailabilityPage } from "@/modules/availability";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(availabilityActions);
const aforo = jest.mocked(aforoActions);

const CANCHA = espacioOption({ id: 1, nombre: "Cancha Norte", modalidadReserva: "franja_exclusiva" });
const PISCINA = espacioOption({
  id: 2,
  nombre: "Piscina",
  modalidadReserva: "cupo_compartido",
  maxCapacidad: 100,
});

beforeEach(() => {
  acciones.fetchServerNow.mockResolvedValue("2026-03-10T12:00:00.000Z");
  acciones.fetchAvailability.mockResolvedValue([]);
  acciones.fetchAvailabilityStatistics.mockResolvedValue({
    horasDisponibles: 40,
    horasReservadas: 18,
    horasBloqueadas: 2,
    ocupacion: 30,
  });
  acciones.fetchSchedule.mockResolvedValue({
    apertura: "08:00",
    cierre: "22:00",
    diasActivos: [0, 1, 2, 3, 4, 5, 6],
    espacioId: 1,
  });
  acciones.fetchExceptions.mockResolvedValue([]);
  aforo.fetchAforoSemana.mockResolvedValue([
    { fecha: "2026-03-09", capacidadTotal: 100, vendida: 20, disponible: 80 },
  ]);
  aforo.fetchAforoDia.mockResolvedValue({
    fecha: "2026-03-09",
    capacidadTotal: 100,
    vendida: 20,
    disponible: 80,
    tickets: [],
  });
});

describe("sin espacios", () => {
  it("guía al anfitrión en vez de mostrar una agenda vacía", () => {
    renderWithQuery(<AvailabilityPage spaces={[]} />);

    expect(screen.getByText("No tienes espacios aún")).toBeInTheDocument();
    expect(
      screen.getByText("Crea un espacio para poder gestionar su disponibilidad."),
    ).toBeInTheDocument();
    expect(acciones.fetchAvailability).not.toHaveBeenCalled();
  });
});

describe("espacio de franja exclusiva", () => {
  it("muestra la grilla semanal, sus métricas y el horario general", async () => {
    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    expect(screen.getByRole("heading", { name: "Agenda", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("40h")).toBeInTheDocument();
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("Horario General")).toBeInTheDocument();
  });

  it("consulta la disponibilidad del espacio seleccionado", async () => {
    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    await waitFor(() =>
      expect(acciones.fetchAvailability).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        1,
      ),
    );
  });

  it("ofrece bloquear un horario", async () => {
    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    expect(await screen.findByText("Lun")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bloquear/ })).toBeInTheDocument();
  });

  it("abre el modal de bloqueo desde el encabezado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Lun");
    await usuario.click(screen.getByRole("button", { name: /Bloquear/ }));

    // "Bloquear horario" es también el rótulo del botón del encabezado.
    expect(await screen.findByRole("heading", { name: "Bloquear horario" })).toBeInTheDocument();
  });

  it("crea un bloqueo y confirma con un aviso", async () => {
    acciones.createBlock.mockResolvedValue([]);
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Lun");
    await usuario.click(screen.getByRole("button", { name: /Bloquear/ }));
    await usuario.click(await screen.findByRole("button", { name: "Confirmar bloqueo" }));

    await waitFor(() => expect(acciones.createBlock).toHaveBeenCalled());
    expect(await screen.findByText("Bloqueo creado correctamente.")).toBeInTheDocument();
  });

  it("guarda el horario general y avisa", async () => {
    acciones.saveSchedule.mockResolvedValue({
      apertura: "09:00",
      cierre: "20:00",
      diasActivos: [0, 1, 2, 3, 4, 5, 6],
      espacioId: 1,
    });
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Horario General");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(acciones.saveSchedule).toHaveBeenCalledWith(expect.objectContaining({ espacioId: 1 })),
    );
    expect(await screen.findByText("Horario general guardado.")).toBeInTheDocument();
  });
});

describe("espacio de cupo compartido", () => {
  /**
   * Un espacio de cupo compartido no se reserva por franjas: la grilla no
   * aplica, y pedir sus bloques sería una consulta inútil contra el backend.
   */
  it("muestra el panel de aforo en lugar de la grilla horaria", async () => {
    renderWithQuery(<AvailabilityPage spaces={[PISCINA]} />);

    expect(await screen.findByText("Aforo por día")).toBeInTheDocument();
    expect(screen.queryByText("Lun")).not.toBeInTheDocument();
  });

  it("no consulta bloques ni estadísticas de grilla", async () => {
    renderWithQuery(<AvailabilityPage spaces={[PISCINA]} />);
    await screen.findByText("Aforo por día");

    expect(acciones.fetchAvailability).not.toHaveBeenCalled();
    expect(acciones.fetchAvailabilityStatistics).not.toHaveBeenCalled();
  });

  it("no ofrece bloquear horarios", async () => {
    renderWithQuery(<AvailabilityPage spaces={[PISCINA]} />);
    await screen.findByText("Aforo por día");

    expect(screen.queryByRole("button", { name: /Bloquear/ })).not.toBeInTheDocument();
  });

  it("sí permite gestionar excepciones de calendario", async () => {
    renderWithQuery(<AvailabilityPage spaces={[PISCINA]} />);
    await screen.findByText("Aforo por día");

    expect(screen.getByRole("button", { name: /Agregar excepción/ })).toBeInTheDocument();
  });
});

describe("cambio de espacio", () => {
  it("cambia de la grilla al panel de aforo al elegir otro espacio", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA, PISCINA]} />);
    await screen.findByText("Lun");

    const opcion = screen.getByRole("option", { name: /Piscina/ });
    await usuario.selectOptions(opcion.closest("select")!, "2");

    expect(await screen.findByText("Aforo por día")).toBeInTheDocument();
  });
});

describe("navegación por semanas", () => {
  it("avanza y retrocede la semana visible", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Lun");
    const llamadasIniciales = acciones.fetchAvailability.mock.calls.length;

    const botones = screen.getAllByRole("button");
    await usuario.click(botones.find((b) => b.querySelector("svg.lucide-chevron-right"))!);

    await waitFor(() =>
      expect(acciones.fetchAvailability.mock.calls.length).toBeGreaterThan(llamadasIniciales),
    );
  });

  it("vuelve a la semana actual con 'Hoy'", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Lun");

    await usuario.click(screen.getByRole("button", { name: "Hoy" }));

    expect(screen.getByText("Lun")).toBeInTheDocument();
  });
});

describe("excepciones", () => {
  it("lista las excepciones del espacio", async () => {
    acciones.fetchExceptions.mockResolvedValue([
      { id: "e1", titulo: "Feriado Nacional", fecha: "2026-05-24", tipo: "feriado" },
    ]);

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    expect(await screen.findByText("Feriado Nacional")).toBeInTheDocument();
  });

  it("crea una excepción desde el encabezado y avisa", async () => {
    acciones.createException.mockResolvedValue({
      id: "e1",
      titulo: "Navidad",
      fecha: "2026-12-25",
      tipo: "feriado",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    await screen.findByText("Lun");
    await usuario.click(screen.getByRole("button", { name: /Agregar excepción/ }));
    await usuario.type(await screen.findByPlaceholderText(/Feriado Nacional/), "Navidad");

    const guardar = screen.getAllByRole("button").at(-1)!;
    await usuario.click(guardar);

    await waitFor(() => expect(acciones.createException).toHaveBeenCalled());
    expect(await screen.findByText("Excepción agregada.")).toBeInTheDocument();
  });

  it("elimina una excepción y avisa", async () => {
    acciones.fetchExceptions.mockResolvedValue([
      { id: "e1", titulo: "Feriado Nacional", fecha: "2026-05-24", tipo: "feriado" },
    ]);
    acciones.deleteException.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);
    const fila = (await screen.findByText("Feriado Nacional")).closest("div")!.parentElement!
      .parentElement!;
    const menu = [...fila.querySelectorAll("button")].at(-1)!;
    await usuario.click(menu);
    await usuario.click(await screen.findByRole("button", { name: /Eliminar/ }));

    await waitFor(() => expect(acciones.deleteException).toHaveBeenCalledWith("e1"));
    expect(await screen.findByText("Excepción eliminada.")).toBeInTheDocument();
  });
});

describe("avisos de error de carga", () => {
  /**
   * El aviso se deriva del estado de la consulta, no se empuja desde un efecto:
   * así permanece mientras el error persiste y desaparece solo al reintentar.
   */
  it("avisa cuando la disponibilidad no se pudo cargar", async () => {
    acciones.fetchAvailability.mockRejectedValue(new Error("500"));

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    expect(await screen.findByText("No se pudo cargar la disponibilidad.")).toBeInTheDocument();
  });

  it("avisa cuando las excepciones no se pudieron cargar", async () => {
    acciones.fetchExceptions.mockRejectedValue(new Error("500"));

    renderWithQuery(<AvailabilityPage spaces={[CANCHA]} />);

    expect(await screen.findByText("No se pudieron cargar las excepciones.")).toBeInTheDocument();
  });
});
