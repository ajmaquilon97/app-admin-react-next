/**
 * Tarjetas de fechas especiales y promociones, y panel de aforo.
 *
 * Las dos tarjetas comparten patrón: un formulario plegable que valida con Zod,
 * se cierra al guardar y muestra el error del backend sin perder lo escrito.
 * El panel de aforo, en cambio, es el sustituto de la grilla horaria para los
 * espacios de cupo compartido.
 */

jest.mock("@/modules/availability/actions/aforo", () => ({
  fetchAforoSemana: jest.fn(),
  fetchAforoDia: jest.fn(),
}));

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as aforoActions from "@/modules/availability/actions/aforo";
import { SpecialRatesCard } from "@/modules/pricing/components/SpecialRatesCard";
import { PromotionsCard } from "@/modules/pricing/components/PromotionsCard";
import { AforoPanel } from "@/modules/availability/components/AforoPanel";
import type { FechaEspecial, Promocion } from "@/modules/pricing/types";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const aforo = jest.mocked(aforoActions);

const fecha = (o: Partial<FechaEspecial> = {}): FechaEspecial => ({
  id: "f1",
  fecha: "2026-12-25",
  descripcion: "Navidad",
  precio: 80,
  modalidad: "evento",
  ...o,
});

const promo = (o: Partial<Promocion> = {}): Promocion => ({
  id: "p1",
  nombre: "Descuento fin de semana",
  tipo: "porcentaje",
  valor: 20,
  activa: true,
  condicion: "Sábados y domingos",
  ...o,
});

describe("SpecialRatesCard", () => {
  const props = {
    fechas: [] as FechaEspecial[],
    onAdd: jest.fn().mockResolvedValue(undefined),
    onDelete: jest.fn(),
    archetype: "franja_exclusiva" as const,
  };

  it("indica cuando no hay fechas especiales", () => {
    renderWithQuery(<SpecialRatesCard {...props} />);

    expect(screen.getByText("No hay fechas especiales configuradas.")).toBeInTheDocument();
  });

  it("lista cada fecha con su modalidad y precio", () => {
    renderWithQuery(<SpecialRatesCard {...props} fechas={[fecha()]} />);

    expect(screen.getByText("Navidad")).toBeInTheDocument();
    expect(screen.getByText("2026-12-25 · Por Evento")).toBeInTheDocument();
    expect(screen.getByText("$80.00")).toBeInTheDocument();
  });

  it("abre y cierra el formulario de alta", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} />);
    expect(screen.queryByPlaceholderText("Ej: Feriado nacional")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));
    expect(screen.getByPlaceholderText("Ej: Feriado nacional")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByPlaceholderText("Ej: Feriado nacional")).not.toBeInTheDocument();
  });

  /** El arquetipo decide qué modalidades tienen sentido para el espacio. */
  it("ofrece hora, jornada y evento en franja exclusiva", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(screen.getByRole("option", { name: "Por Hora" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Por Entrada" })).not.toBeInTheDocument();
  });

  it("ofrece solo entrada en cupo compartido", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} archetype="cupo_compartido" />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(screen.getByRole("option", { name: "Por Entrada" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Por Hora" })).not.toBeInTheDocument();
  });

  it("exige descripción antes de guardar", async () => {
    const onAdd = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Agrega una descripción")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("guarda la fecha especial y cierra el formulario", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<SpecialRatesCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));
    await usuario.type(container.querySelector('input[type="date"]')!, "2026-12-25");
    await usuario.type(screen.getByRole("spinbutton"), "80");
    await usuario.type(screen.getByPlaceholderText("Ej: Feriado nacional"), "Navidad");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({
        fecha: "2026-12-25",
        precio: 80,
        descripcion: "Navidad",
        modalidad: "hora",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Ej: Feriado nacional")).not.toBeInTheDocument(),
    );
  });

  it("muestra el error del backend sin cerrar el formulario", async () => {
    const onAdd = jest.fn().mockRejectedValue(new Error("Ya existe una tarifa para esa fecha."));
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<SpecialRatesCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));
    await usuario.type(container.querySelector('input[type="date"]')!, "2026-12-25");
    await usuario.type(screen.getByRole("spinbutton"), "80");
    await usuario.type(screen.getByPlaceholderText("Ej: Feriado nacional"), "Navidad");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Ya existe una tarifa para esa fecha.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: Feriado nacional")).toBeInTheDocument();
  });

  it("elimina una fecha especial", async () => {
    const onDelete = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} fechas={[fecha()]} onDelete={onDelete} />);
    const fila = screen.getByText("Navidad").closest("div")!.parentElement!;
    await usuario.click(within(fila).getAllByRole("button").at(-1)!);

    expect(onDelete).toHaveBeenCalledWith("f1");
  });

  it("bloquea el guardado mientras la operación está en curso", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SpecialRatesCard {...props} loading />);
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });
});

describe("PromotionsCard", () => {
  const props = {
    promociones: [] as Promocion[],
    onAdd: jest.fn().mockResolvedValue(undefined),
    onToggle: jest.fn(),
    onDelete: jest.fn(),
  };

  it("indica cuando no hay promociones", () => {
    renderWithQuery(<PromotionsCard {...props} />);

    expect(screen.getByText("Sin promociones activas.")).toBeInTheDocument();
  });

  it("muestra un descuento porcentual con el símbolo correcto", () => {
    renderWithQuery(<PromotionsCard {...props} promociones={[promo()]} />);

    expect(screen.getByText("Descuento fin de semana")).toBeInTheDocument();
    expect(screen.getByText("Sábados y domingos")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("muestra un descuento de monto fijo con dos decimales", () => {
    renderWithQuery(
      <PromotionsCard {...props} promociones={[promo({ tipo: "monto_fijo", valor: 5 })]} />,
    );

    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("exige nombre y condición antes de guardar", async () => {
    const onAdd = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<PromotionsCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Nueva/ }));
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Nombre requerido")).toBeInTheDocument();
    expect(screen.getByText("Condición requerida")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("crea la promoción activa por defecto", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<PromotionsCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Nueva/ }));
    await usuario.type(screen.getByPlaceholderText("Ej: Descuento fin de semana"), "2x1 martes");
    await usuario.type(screen.getByRole("spinbutton"), "50");
    await usuario.type(screen.getByPlaceholderText("Ej: Reservas de 3+ horas"), "Solo martes");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({
        nombre: "2x1 martes",
        tipo: "porcentaje",
        valor: 50,
        activa: true,
        condicion: "Solo martes",
      }),
    );
  });

  it("permite elegir descuento de monto fijo", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<PromotionsCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Nueva/ }));
    await usuario.type(screen.getByPlaceholderText("Ej: Descuento fin de semana"), "Madrugador");
    await usuario.selectOptions(screen.getByRole("combobox"), "monto_fijo");
    await usuario.type(screen.getByRole("spinbutton"), "5");
    await usuario.type(screen.getByPlaceholderText("Ej: Reservas de 3+ horas"), "Antes de las 9");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ tipo: "monto_fijo" })),
    );
  });

  it("muestra el error del backend al crear", async () => {
    const onAdd = jest.fn().mockRejectedValue(new Error("Ya existe una promoción con ese nombre."));
    const usuario = userEvent.setup();

    renderWithQuery(<PromotionsCard {...props} onAdd={onAdd} />);
    await usuario.click(screen.getByRole("button", { name: /Nueva/ }));
    await usuario.type(screen.getByPlaceholderText("Ej: Descuento fin de semana"), "2x1");
    await usuario.type(screen.getByRole("spinbutton"), "50");
    await usuario.type(screen.getByPlaceholderText("Ej: Reservas de 3+ horas"), "Martes");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Ya existe una promoción con ese nombre.")).toBeInTheDocument();
  });

  it("alterna el estado de una promoción", async () => {
    const onToggle = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <PromotionsCard {...props} promociones={[promo({ activa: true })]} onToggle={onToggle} />,
    );
    const fila = screen.getByText("Descuento fin de semana").closest("div")!.parentElement!
      .parentElement!;
    const botones = within(fila).getAllByRole("button");
    await usuario.click(botones.at(-2)!);

    expect(onToggle).toHaveBeenCalledWith("p1", false);
  });

  it("elimina una promoción", async () => {
    const onDelete = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <PromotionsCard {...props} promociones={[promo()]} onDelete={onDelete} />,
    );
    const fila = screen.getByText("Descuento fin de semana").closest("div")!.parentElement!
      .parentElement!;
    await usuario.click(within(fila).getAllByRole("button").at(-1)!);

    expect(onDelete).toHaveBeenCalledWith("p1");
  });
});

describe("AforoPanel", () => {
  const espacio = espacioOption({
    id: 1,
    nombre: "Piscina",
    modalidadReserva: "cupo_compartido",
    maxCapacidad: 100,
  });
  const LUNES = new Date("2026-03-09T00:00:00");

  const semana = [
    { fecha: "2026-03-09", capacidadTotal: 100, vendida: 20, disponible: 80 },
    { fecha: "2026-03-10", capacidadTotal: 100, vendida: 80, disponible: 20 },
    { fecha: "2026-03-11", capacidadTotal: 100, vendida: 100, disponible: 0 },
  ];

  beforeEach(() => {
    aforo.fetchAforoSemana.mockResolvedValue(semana);
    aforo.fetchAforoDia.mockResolvedValue({
      fecha: "2026-03-09",
      capacidadTotal: 100,
      vendida: 20,
      disponible: 80,
      tickets: [{ id: "2026-03-09-1", clienteNombre: "Ana", cantidad: 2, hora: "10:15" }],
    });
  });

  it("muestra el aforo máximo del espacio", async () => {
    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText(/Aforo máximo: 100 personas/)).toBeInTheDocument();
  });

  it("dibuja una barra por día con el vendido sobre la capacidad", async () => {
    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText("20/100")).toBeInTheDocument();
    expect(screen.getByText("80/100")).toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
  });

  /** El color anticipa el riesgo de quedarse sin cupo: verde, ámbar y rojo. */
  it("colorea la barra según la ocupación del día", async () => {
    const { container } = renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);
    await screen.findByText("20/100");

    const barras = [...container.querySelectorAll<HTMLElement>('[style*="width"]')];
    expect(barras[0]!.className).toContain("bg-success"); // 20%
    expect(barras[1]!.className).toContain("bg-warning"); // 80%
    expect(barras[2]!.className).toContain("bg-error"); // 100%
  });

  it("abre el primer día de la semana por defecto", async () => {
    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText("Entradas del 2026-03-09")).toBeInTheDocument();
    expect(await screen.findByText("Ana")).toBeInTheDocument();
  });

  it("carga el detalle del día que el usuario elige", async () => {
    aforo.fetchAforoDia.mockResolvedValue({
      fecha: "2026-03-10",
      capacidadTotal: 100,
      vendida: 80,
      disponible: 20,
      tickets: [],
    });
    const usuario = userEvent.setup();

    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);
    await usuario.click(await screen.findByText("80/100"));

    await waitFor(() => expect(aforo.fetchAforoDia).toHaveBeenCalledWith(1, "2026-03-10"));
    expect(await screen.findByText("Sin ventas registradas este día.")).toBeInTheDocument();
  });

  it("muestra el disponible sobre el total del día abierto", async () => {
    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText("80 disponibles de 100")).toBeInTheDocument();
  });

  it("informa del fallo al cargar la semana", async () => {
    aforo.fetchAforoSemana.mockRejectedValue(new Error("No se pudo cargar el aforo."));

    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText("No se pudo cargar el aforo.")).toBeInTheDocument();
  });

  it("informa del fallo al cargar el detalle de un día", async () => {
    aforo.fetchAforoDia.mockRejectedValue(new Error("No se pudo cargar el detalle del día."));

    renderWithQuery(<AforoPanel espacio={espacio} weekStart={LUNES} />);

    expect(await screen.findByText("No se pudo cargar el detalle del día.")).toBeInTheDocument();
  });
});
