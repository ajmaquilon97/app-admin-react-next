/**
 * Componentes de la agenda: grilla semanal, horario general, excepciones y los
 * modales de bloqueo.
 *
 * La grilla es donde más lógica de presentación se concentra: qué celda está
 * ocupada, cuál ya pasó según el reloj **del servidor** (no el del navegador) y
 * cuál sigue siendo reservable. Ese cálculo es lo que estas pruebas fijan.
 */

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvailabilityCalendar } from "@/modules/availability/components/AvailabilityCalendar";
import { AvailabilityStats } from "@/modules/availability/components/AvailabilityStats";
import { AvailabilityToolbar } from "@/modules/availability/components/AvailabilityToolbar";
import { ExceptionsCard } from "@/modules/availability/components/ExceptionsCard";
import { GeneralScheduleCard } from "@/modules/availability/components/GeneralScheduleCard";
import { BlockModal } from "@/modules/availability/components/BlockModal";
import { ExceptionModal } from "@/modules/availability/components/ExceptionModal";
import type { Block, AvailabilityException } from "@/modules/availability";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const LUNES = new Date("2026-03-09T00:00:00");

const bloque = (o: Partial<Block> = {}): Block => ({
  id: "b1",
  espacioId: 1,
  espacioNombre: "Cancha Norte",
  date: "2026-03-10",
  hour: 14,
  status: "reserved",
  clientName: "María Fernanda Pérez",
  ...o,
});

describe("AvailabilityCalendar", () => {
  const props = {
    blocks: [] as Block[],
    weekStart: LUNES,
    selectedEspacioId: 1,
    statusFilter: "all",
    isLoading: false,
    onBlockClick: jest.fn(),
    onEmptyCellClick: jest.fn(),
    serverNow: null,
  };

  it("dibuja los siete días y el rango de respaldo cuando no hay horario", () => {
    renderWithQuery(<AvailabilityCalendar {...props} />);

    for (const dia of ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]) {
      expect(screen.getByText(dia)).toBeInTheDocument();
    }
    expect(screen.getByText("8:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.queryByText("19:00")).not.toBeInTheDocument();
  });

  /**
   * El horario por defecto ya cierra a las 22:00: con las once franjas fijas de
   * antes, todo lo posterior a las 18:00 no se dibujaba en ninguna celda.
   */
  it("extiende la grilla hasta la hora de cierre del espacio", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        schedule={{ apertura: "08:00", cierre: "22:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] }}
      />,
    );

    expect(screen.getByText("21:00")).toBeInTheDocument();
    expect(screen.queryByText("22:00")).not.toBeInTheDocument();
  });

  it("dibuja el día completo para un espacio abierto hasta medianoche", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        schedule={{ apertura: "00:00", cierre: "24:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] }}
      />,
    );

    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  /** Un horario que cruza la medianoche no cabe en un tramo contiguo del día. */
  it("dibuja el día completo si el cierre es anterior a la apertura", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        schedule={{ apertura: "20:00", cierre: "02:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] }}
      />,
    );

    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
  });

  /** El dato manda sobre el horario: una reserva fuera de él seguiría existiendo. */
  it("amplía la grilla para no ocultar un bloque fuera del horario", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        schedule={{ apertura: "08:00", cierre: "18:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] }}
        blocks={[bloque({ hour: 23 })]}
      />,
    );

    expect(screen.getByText("23:00")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
  });

  /** Si el alto cambiara al filtrar, la grilla "saltaría" bajo el cursor. */
  it("mantiene el alto de la grilla al cambiar el filtro de estado", () => {
    const conBloqueTardio = {
      ...props,
      schedule: { apertura: "08:00", cierre: "18:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] },
      blocks: [bloque({ hour: 23 })],
    };
    const { rerender } = renderWithQuery(<AvailabilityCalendar {...conBloqueTardio} />);
    expect(screen.getByText("23:00")).toBeInTheDocument();

    rerender(<AvailabilityCalendar {...conBloqueTardio} statusFilter="blocked" />);

    expect(screen.getByText("23:00")).toBeInTheDocument();
    expect(screen.queryByText("Reservado")).not.toBeInTheDocument();
  });

  it("muestra el esqueleto mientras carga", () => {
    const { container } = renderWithQuery(<AvailabilityCalendar {...props} isLoading />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("Lun")).not.toBeInTheDocument();
  });

  it("pinta la reserva con el nombre del cliente en su celda", () => {
    renderWithQuery(<AvailabilityCalendar {...props} blocks={[bloque()]} />);

    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.getByText("María Fernanda Pérez")).toBeInTheDocument();
  });

  it("cae al nombre del espacio si el bloqueo no tiene cliente", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        blocks={[bloque({ status: "blocked", clientName: undefined, notes: "Mantenimiento" })]}
      />,
    );

    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
    expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
  });

  /** La grilla es por espacio: un bloque de otro espacio no debe filtrarse. */
  it("ignora los bloques de otro espacio", () => {
    renderWithQuery(<AvailabilityCalendar {...props} blocks={[bloque({ espacioId: 99 })]} />);

    expect(screen.queryByText("Reservado")).not.toBeInTheDocument();
  });

  it("respeta el filtro de estado", () => {
    renderWithQuery(<AvailabilityCalendar {...props} blocks={[bloque()]} statusFilter="blocked" />);

    expect(screen.queryByText("Reservado")).not.toBeInTheDocument();
  });

  it("abre el detalle al pulsar un bloque ocupado", async () => {
    const onBlockClick = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <AvailabilityCalendar {...props} blocks={[bloque()]} onBlockClick={onBlockClick} />,
    );
    await usuario.click(screen.getByText("Reservado"));

    expect(onBlockClick).toHaveBeenCalledWith(expect.objectContaining({ id: "b1" }));
  });

  /**
   * "Ya pasó" se decide con la hora del servidor: si dependiera del reloj del
   * navegador, un equipo desfasado dejaría reservar franjas vencidas.
   */
  it("marca como no disponibles las franjas anteriores a la hora del servidor", () => {
    renderWithQuery(
      <AvailabilityCalendar {...props} serverNow={new Date("2026-03-09T12:00:00")} />,
    );

    // Lunes 8:00–11:00 ya terminaron a las 12:00; el resto de la semana no.
    expect(screen.getAllByText("No Disponible").length).toBeGreaterThan(0);
  });

  it("no marca nada como pasado mientras la hora del servidor no llega", () => {
    renderWithQuery(<AvailabilityCalendar {...props} serverNow={null} />);

    expect(screen.queryByText("No Disponible")).not.toBeInTheDocument();
  });

  /** Una reserva ya cerrada debe seguir siendo consultable aunque la hora pasara. */
  it("mantiene visible una reserva en una franja ya vencida", () => {
    renderWithQuery(
      <AvailabilityCalendar
        {...props}
        blocks={[bloque({ date: "2026-03-09", hour: 8 })]}
        serverNow={new Date("2026-03-09T12:00:00")}
      />,
    );

    expect(screen.getByText("Reservado")).toBeInTheDocument();
  });
});

describe("AvailabilityStats", () => {
  const stats = {
    horasDisponibles: 40,
    horasReservadas: 18,
    horasBloqueadas: 2,
    ocupacion: 30,
  };

  it("muestra las cuatro métricas con sus unidades", () => {
    renderWithQuery(<AvailabilityStats stats={stats} isLoading={false} />);

    expect(screen.getByText("40h")).toBeInTheDocument();
    expect(screen.getByText("18h")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("muestra el esqueleto mientras carga o si no hay datos", () => {
    const { container, rerender } = renderWithQuery(
      <AvailabilityStats stats={stats} isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);

    rerender(<AvailabilityStats stats={null} isLoading={false} />);
    expect(screen.queryByText("40h")).not.toBeInTheDocument();
  });
});

describe("AvailabilityToolbar", () => {
  const props = {
    viewMode: "week" as const,
    setViewMode: jest.fn(),
    statusFilter: "all",
    setStatusFilter: jest.fn(),
    weekStart: LUNES,
    onPrev: jest.fn(),
    onNext: jest.fn(),
    onToday: jest.fn(),
  };

  it("rotula la semana con un solo mes cuando no la cruza", () => {
    renderWithQuery(<AvailabilityToolbar {...props} />);

    expect(screen.getByText("9 - 15 Marzo, 2026")).toBeInTheDocument();
  });

  it("nombra ambos meses cuando la semana los cruza", () => {
    renderWithQuery(
      <AvailabilityToolbar {...props} weekStart={new Date("2026-03-30T00:00:00")} />,
    );

    expect(screen.getByText("30 Marzo - 5 Abril, 2026")).toBeInTheDocument();
  });

  it("navega entre semanas y vuelve a hoy", async () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const onToday = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <AvailabilityToolbar {...props} onPrev={onPrev} onNext={onNext} onToday={onToday} />,
    );
    const botones = screen.getAllByRole("button");

    await usuario.click(botones.find((b) => b.querySelector("svg.lucide-chevron-left"))!);
    await usuario.click(screen.getByRole("button", { name: "Hoy" }));
    await usuario.click(botones.find((b) => b.querySelector("svg.lucide-chevron-right"))!);

    expect(onPrev).toHaveBeenCalled();
    expect(onToday).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("filtra por estado de la franja", async () => {
    const setStatusFilter = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityToolbar {...props} setStatusFilter={setStatusFilter} />);
    await usuario.selectOptions(screen.getByRole("combobox"), "maintenance");

    expect(setStatusFilter).toHaveBeenCalledWith("maintenance");
  });

  /** Cupo compartido no tiene estado por hora: la barra se simplifica. */
  it("oculta vista y filtro para espacios de cupo compartido", () => {
    renderWithQuery(<AvailabilityToolbar {...props} simplified />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Semana" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hoy" })).toBeInTheDocument();
  });
});

describe("ExceptionsCard", () => {
  const excepcion = (o: Partial<AvailabilityException> = {}): AvailabilityException => ({
    id: "e1",
    titulo: "Feriado Nacional",
    fecha: "2026-05-24",
    tipo: "feriado",
    ...o,
  });

  const props = {
    exceptions: [excepcion()],
    onAdd: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it("indica cuando no hay excepciones configuradas", () => {
    renderWithQuery(<ExceptionsCard {...props} exceptions={[]} />);

    expect(screen.getByText("No hay excepciones configuradas.")).toBeInTheDocument();
  });

  it("describe una excepción de día completo", () => {
    renderWithQuery(<ExceptionsCard {...props} />);

    expect(screen.getByText("Feriado Nacional")).toBeInTheDocument();
    expect(screen.getByText("24 May 2026 • Todo el día")).toBeInTheDocument();
  });

  it("describe una excepción con franja horaria", () => {
    renderWithQuery(
      <ExceptionsCard
        {...props}
        exceptions={[excepcion({ horaInicio: "10:00", horaFin: "12:00" })]}
      />,
    );

    expect(screen.getByText("24 May 2026 • 10:00 - 12:00")).toBeInTheDocument();
  });

  it("describe una excepción con hora de inicio abierta", () => {
    renderWithQuery(
      <ExceptionsCard {...props} exceptions={[excepcion({ horaInicio: "18:00" })]} />,
    );

    expect(screen.getByText("24 May 2026 • desde 18:00")).toBeInTheDocument();
  });

  it("edita una excepción desde su menú", async () => {
    const onEdit = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ExceptionsCard {...props} onEdit={onEdit} />);
    const fila = screen.getByText("Feriado Nacional").closest("div")!.parentElement!.parentElement!;
    await usuario.click(within(fila).getAllByRole("button").at(-1)!);
    await usuario.click(await screen.findByRole("button", { name: /Editar/ }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }));
  });

  it("elimina una excepción desde su menú", async () => {
    const onDelete = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ExceptionsCard {...props} onDelete={onDelete} />);
    const fila = screen.getByText("Feriado Nacional").closest("div")!.parentElement!.parentElement!;
    await usuario.click(within(fila).getAllByRole("button").at(-1)!);
    await usuario.click(await screen.findByRole("button", { name: /Eliminar/ }));

    expect(onDelete).toHaveBeenCalledWith("e1");
  });

  it("permite agregar una excepción nueva", async () => {
    const onAdd = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ExceptionsCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(onAdd).toHaveBeenCalled();
  });
});

describe("GeneralScheduleCard", () => {
  const horario = { apertura: "08:00", cierre: "22:00", diasActivos: [0, 1, 2, 3, 4, 5, 6] };

  it("precarga apertura y cierre", () => {
    const { container } = renderWithQuery(
      <GeneralScheduleCard schedule={horario} onSave={jest.fn()} />,
    );

    const horas = container.querySelectorAll('input[type="time"]');
    expect(horas[0]).toHaveValue("08:00");
    expect(horas[1]).toHaveValue("22:00");
  });

  it("selecciona 'Todos los días' cuando los siete están activos", () => {
    renderWithQuery(<GeneralScheduleCard schedule={horario} onSave={jest.fn()} />);

    expect(screen.getByRole("radio", { name: "Todos los días" })).toBeChecked();
    // Con "todos" no se muestran los botones por día.
    expect(screen.queryByRole("button", { name: "L" })).not.toBeInTheDocument();
  });

  it("selecciona 'Por día' cuando el horario es parcial y muestra los siete botones", () => {
    renderWithQuery(
      <GeneralScheduleCard
        schedule={{ ...horario, diasActivos: [0, 1, 2, 3, 4] }}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Por día" })).toBeChecked();
    expect(screen.getByRole("button", { name: "L" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "D" })).toBeInTheDocument();
  });

  it("guarda los siete días cuando el modo es 'Todos los días'", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<GeneralScheduleCard schedule={horario} onSave={onSave} />);
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onSave).toHaveBeenCalledWith({
      apertura: "08:00",
      cierre: "22:00",
      diasActivos: [0, 1, 2, 3, 4, 5, 6],
    });
  });

  it("activa y desactiva un día concreto", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(
      <GeneralScheduleCard
        schedule={{ ...horario, diasActivos: [0, 1, 2, 3, 4] }}
        onSave={onSave}
      />,
    );
    // "S" aparece dos veces (Sábado y ... ) — se toman los botones por posición.
    const dias = screen.getAllByRole("button").filter((b) => b.textContent!.length === 1);
    await usuario.click(dias[5]!); // Sábado
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ diasActivos: expect.arrayContaining([5]) }),
    );
  });

  /**
   * Al cambiar de espacio llega otro horario por props: el formulario debe
   * resincronizarse durante el render (ver AGENTS.md → efectos y estado derivado).
   */
  it("se resincroniza cuando llega el horario de otro espacio", () => {
    const { container, rerender } = renderWithQuery(
      <GeneralScheduleCard schedule={horario} onSave={jest.fn()} />,
    );

    rerender(
      <GeneralScheduleCard
        schedule={{ apertura: "10:00", cierre: "18:00", diasActivos: [0, 1] }}
        onSave={jest.fn()}
      />,
    );

    const horas = container.querySelectorAll('input[type="time"]');
    expect(horas[0]).toHaveValue("10:00");
    expect(horas[1]).toHaveValue("18:00");
    expect(screen.getByRole("radio", { name: "Por día" })).toBeChecked();
  });

  it("muestra el esqueleto mientras carga", () => {
    const { container } = renderWithQuery(
      <GeneralScheduleCard schedule={horario} isLoading onSave={jest.fn()} />,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
  });
});

describe("BlockModal", () => {
  const spaces = [espacioOption({ id: 1, nombre: "Cancha Norte" })];
  const props = { spaces, onClose: jest.fn(), onConfirm: jest.fn().mockResolvedValue(undefined) };

  it("precarga el espacio, la fecha y la hora de la celda pulsada", () => {
    const { container } = renderWithQuery(
      <BlockModal {...props} prefilledDate="2026-03-10" prefilledHour={14} prefilledEspacioId={1} />,
    );

    expect(container.querySelector('input[type="date"]')).toHaveValue("2026-03-10");
    const selects = container.querySelectorAll("select");
    expect(selects[1]).toHaveValue("14"); // hora inicio
    expect(selects[2]).toHaveValue("15"); // hora fin, una franja después
  });

  /** Un rango invertido crearía un bloqueo vacío: se corta antes de llamar al backend. */
  it("rechaza un rango en el que la hora fin no es posterior al inicio", async () => {
    const onConfirm = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<BlockModal {...props} onConfirm={onConfirm} />);
    const selects = container.querySelectorAll("select");
    await usuario.selectOptions(selects[1]!, "12");
    await usuario.selectOptions(selects[2]!, "13");
    // Se sube el inicio por encima del fin ya elegido.
    await usuario.selectOptions(selects[1]!, "18");

    await usuario.click(screen.getByRole("button", { name: "Confirmar bloqueo" }));

    expect(await screen.findByText("La hora fin debe ser posterior a la hora inicio.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("crea el bloqueo con el motivo escrito", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(
      <BlockModal {...props} prefilledDate="2026-03-10" prefilledHour={9} onConfirm={onConfirm} />,
    );
    await usuario.type(screen.getByRole("textbox"), "Mantenimiento programado");
    await usuario.click(screen.getByRole("button", { name: "Mantenimiento" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar bloqueo" }));

    expect(onConfirm).toHaveBeenCalledWith({
      espacioId: 1,
      fecha: "2026-03-10",
      hourStart: 9,
      hourEnd: 10,
      estado: "maintenance",
      notas: "Mantenimiento programado",
    });
  });

  it("omite el motivo cuando se deja vacío", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(
      <BlockModal {...props} prefilledDate="2026-03-10" prefilledHour={9} onConfirm={onConfirm} />,
    );
    await usuario.click(screen.getByRole("button", { name: "Confirmar bloqueo" }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ notas: undefined }));
  });

  it("muestra el error del backend sin cerrar el modal", async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error("Ya existe una reserva en ese horario"));
    const usuario = userEvent.setup();

    renderWithQuery(<BlockModal {...props} onConfirm={onConfirm} />);
    await usuario.click(screen.getByRole("button", { name: "Confirmar bloqueo" }));

    expect(await screen.findByText("Ya existe una reserva en ese horario")).toBeInTheDocument();
  });

  it("no permite bloquear si el anfitrión no tiene espacios", () => {
    renderWithQuery(<BlockModal {...props} spaces={[]} />);

    expect(screen.getByRole("button", { name: "Confirmar bloqueo" })).toBeDisabled();
  });

  it("cierra sin bloquear", async () => {
    const onClose = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<BlockModal {...props} onClose={onClose} />);
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("ExceptionModal", () => {
  const props = { onClose: jest.fn(), onConfirm: jest.fn().mockResolvedValue(undefined) };

  it("se abre en modo alta con feriado y día completo por defecto", () => {
    renderWithQuery(<ExceptionModal {...props} />);

    // "Agregar excepción" es a la vez el título del modal y el rótulo del botón.
    expect(screen.getByRole("heading", { name: "Agregar excepción" })).toBeInTheDocument();
    expect(screen.getByText("Todo el día")).toBeInTheDocument();
    expect(screen.queryByLabelText("Hora inicio")).not.toBeInTheDocument();
  });

  it("se abre en modo edición con los datos de la excepción", () => {
    renderWithQuery(
      <ExceptionModal
        {...props}
        exception={{
          id: "e1",
          titulo: "Feriado Nacional",
          fecha: "2026-05-24",
          tipo: "cierre",
          horaInicio: "10:00",
          horaFin: "12:00",
        }}
      />,
    );

    expect(screen.getByText("Editar excepción")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Feriado Nacional")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10:00")).toBeInTheDocument();
  });

  /** Sin título, la excepción sería indistinguible en la lista. */
  it("no confirma sin título", async () => {
    const onConfirm = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ExceptionModal {...props} onConfirm={onConfirm} />);
    await usuario.click(screen.getByRole("button", { name: /Guardar|Agregar excepción/ }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("crea una excepción de día completo sin horas", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ExceptionModal {...props} onConfirm={onConfirm} />);
    await usuario.type(screen.getByPlaceholderText(/Feriado Nacional/), "  Navidad  ");
    const fecha = container.querySelector('input[type="date"]')!;
    await usuario.clear(fecha);
    await usuario.type(fecha, "2026-12-25");

    const guardar = screen.getAllByRole("button").at(-1)!;
    await usuario.click(guardar);

    expect(onConfirm).toHaveBeenCalledWith({
      titulo: "Navidad",
      tipo: "feriado",
      fecha: "2026-12-25",
      horaInicio: undefined,
      horaFin: undefined,
    });
  });

  it("permite elegir el tipo de excepción", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<ExceptionModal {...props} onConfirm={onConfirm} />);
    await usuario.type(screen.getByPlaceholderText(/Feriado Nacional/), "Revisión");
    await usuario.click(screen.getByRole("button", { name: "Mantenimiento" }));
    await usuario.click(screen.getAllByRole("button").at(-1)!);

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ tipo: "mantenimiento" }));
  });
});
