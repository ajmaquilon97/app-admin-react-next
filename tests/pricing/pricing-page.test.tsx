/**
 * Pantalla de Gestión de Tarifas.
 *
 * Es la única del portal con un **borrador local**: los cambios de modalidades y
 * tarifas por día se editan en memoria y solo viajan al backend al pulsar
 * Guardar. Las pruebas fijan que ese borrador se resincronice al cambiar de
 * espacio, que la validación corra antes de enviar, y que las fechas especiales
 * y promociones —que sí tienen su propio CRUD inmediato— no dependan de él.
 */

jest.mock("@/modules/pricing/actions/pricing", () => ({
  getPricing: jest.fn(),
  savePricing: jest.fn(),
  addFechaEspecial: jest.fn(),
  deleteFechaEspecial: jest.fn(),
  addPromocion: jest.fn(),
  togglePromocion: jest.fn(),
  deletePromocion: jest.fn(),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as pricingActions from "@/modules/pricing/actions/pricing";
import { PricingPage } from "@/modules/pricing";
import type { EspacioPricing } from "@/modules/pricing";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(pricingActions);

const CANCHA = espacioOption({ id: 1, nombre: "Cancha Norte", modalidadReserva: "franja_exclusiva" });
const PISCINA = espacioOption({ id: 2, nombre: "Piscina", modalidadReserva: "cupo_compartido" });

const pricing = (o: Partial<EspacioPricing> = {}): EspacioPricing => ({
  espacioId: 1,
  modalidades: {
    hora: { activa: true, precio: 25 },
    jornada: { activa: false, precio: null },
    evento: { activa: false, precio: null },
    entrada: { activa: false, precio: null },
  },
  tarifasPorDia: [{ dia: 0, activo: true, precio: 30 }],
  fechasEspeciales: [],
  promociones: [],
  ...o,
});

beforeEach(() => {
  acciones.getPricing.mockResolvedValue(pricing());
  acciones.savePricing.mockResolvedValue(pricing());
});

describe("sin espacios", () => {
  it("guía a crear el primer espacio", () => {
    renderWithQuery(<PricingPage espacios={[]} />);

    expect(screen.getByText("Crea tu primer espacio para configurar tarifas.")).toBeInTheDocument();
    expect(acciones.getPricing).not.toHaveBeenCalled();
  });
});

describe("carga inicial", () => {
  it("selecciona el primer espacio y carga sus tarifas", async () => {
    renderWithQuery(<PricingPage espacios={[CANCHA, PISCINA]} />);

    expect(screen.getByRole("heading", { name: "Gestión de Tarifas", level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(acciones.getPricing).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Modalidades de Cobro")).toBeInTheDocument();
  });

  it("compone modalidades, tarifas por día, fechas, promociones y vista previa", async () => {
    renderWithQuery(<PricingPage espacios={[CANCHA]} />);

    expect(await screen.findByText("Modalidades de Cobro")).toBeInTheDocument();
    expect(screen.getByText("Tarifa por Día")).toBeInTheDocument();
    expect(screen.getByText("Fechas Especiales")).toBeInTheDocument();
    expect(screen.getByText("Promociones")).toBeInTheDocument();
    expect(screen.getByText("Vista Previa")).toBeInTheDocument();
  });

  it("mantiene Guardar deshabilitado hasta que hay borrador", () => {
    acciones.getPricing.mockImplementation(() => new Promise(() => {}));

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});

describe("arquetipo del espacio seleccionado", () => {
  it("ofrece las modalidades de franja exclusiva", async () => {
    renderWithQuery(<PricingPage espacios={[CANCHA]} />);

    expect(await screen.findByText("Por Hora")).toBeInTheDocument();
    expect(screen.queryByText("Por Entrada")).not.toBeInTheDocument();
  });

  it("ofrece solo entrada en un espacio de cupo compartido", async () => {
    acciones.getPricing.mockResolvedValue(pricing({ espacioId: 2 }));

    renderWithQuery(<PricingPage espacios={[PISCINA]} />);

    expect(await screen.findByText("Por Entrada")).toBeInTheDocument();
    expect(screen.queryByText("Por Hora")).not.toBeInTheDocument();
  });
});

describe("cambio de espacio", () => {
  /** El borrador del espacio anterior no debe arrastrarse al siguiente. */
  it("recarga las tarifas del nuevo espacio", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA, PISCINA]} />);
    await screen.findByText("Modalidades de Cobro");

    acciones.getPricing.mockResolvedValue(pricing({ espacioId: 2 }));
    await usuario.selectOptions(screen.getByRole("combobox"), "2");

    await waitFor(() => expect(acciones.getPricing).toHaveBeenCalledWith(2));
  });

  it("muestra el nombre del espacio activo en la vista previa", async () => {
    renderWithQuery(<PricingPage espacios={[CANCHA]} />);

    expect(await screen.findByText("Cancha Norte")).toBeInTheDocument();
  });
});

describe("guardado del tarifario", () => {
  it("envía el borrador y confirma con '¡Guardado!'", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    await screen.findByText("Modalidades de Cobro");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(acciones.savePricing).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "¡Guardado!" })).toBeInTheDocument();
  });

  /** La validación corre sobre el borrador antes de gastar una petición. */
  it("bloquea el guardado si un precio no es positivo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    await screen.findByText("Modalidades de Cobro");

    const precio = screen.getAllByRole("spinbutton")[0]!;
    await usuario.clear(precio);
    await usuario.type(precio, "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Debe ser mayor a 0")).toBeInTheDocument();
    expect(acciones.savePricing).not.toHaveBeenCalled();
  });

  it("muestra el error del backend al guardar", async () => {
    acciones.savePricing.mockRejectedValue(new Error("El espacio está inactivo."));
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    await screen.findByText("Modalidades de Cobro");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("El espacio está inactivo.")).toBeInTheDocument();
  });
});

describe("fechas especiales y promociones", () => {
  it("agrega una fecha especial contra el backend", async () => {
    acciones.addFechaEspecial.mockResolvedValue({
      id: "f1",
      fecha: "2026-12-25",
      descripcion: "Navidad",
      precio: 80,
      modalidad: "hora",
    });
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    await screen.findByText("Fechas Especiales");
    await usuario.click(screen.getByRole("button", { name: /Agregar/ }));

    await usuario.type(container.querySelector('input[type="date"]')!, "2026-12-25");
    await usuario.type(screen.getByPlaceholderText("Ej: Feriado nacional"), "Navidad");
    const precios = screen.getAllByRole("spinbutton");
    await usuario.type(precios.at(-1)!, "80");
    // Hay dos botones "Guardar": el del tarifario (type=button, arriba) y el de
    // este formulario, que es el submit.
    const guardarFecha = screen
      .getAllByRole("button", { name: "Guardar" })
      .find((b) => b.getAttribute("type") === "submit")!;
    await usuario.click(guardarFecha);

    await waitFor(() => expect(acciones.addFechaEspecial).toHaveBeenCalledWith(1, expect.anything()));
  });

  it("elimina una fecha especial ya existente", async () => {
    acciones.getPricing.mockResolvedValue(
      pricing({
        fechasEspeciales: [
          { id: "f1", fecha: "2026-12-25", descripcion: "Navidad", precio: 80, modalidad: "evento" },
        ],
      }),
    );
    acciones.deleteFechaEspecial.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    const fila = (await screen.findByText("Navidad")).closest("div")!.parentElement!;
    await usuario.click([...fila.querySelectorAll("button")].at(-1)!);

    await waitFor(() => expect(acciones.deleteFechaEspecial).toHaveBeenCalledWith(1, "f1"));
  });

  it("alterna una promoción existente", async () => {
    acciones.getPricing.mockResolvedValue(
      pricing({
        promociones: [
          { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: true, condicion: "Martes" },
        ],
      }),
    );
    acciones.togglePromocion.mockResolvedValue({
      id: "p1",
      nombre: "2x1",
      tipo: "porcentaje",
      valor: 20,
      activa: false,
      condicion: "Martes",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    const fila = (await screen.findByText("2x1")).closest("div")!.parentElement!.parentElement!;
    const botones = [...fila.querySelectorAll("button")];
    await usuario.click(botones.at(-2)!);

    await waitFor(() => expect(acciones.togglePromocion).toHaveBeenCalledWith(1, "p1", false));
  });

  it("muestra el error del backend al alternar una promoción", async () => {
    acciones.getPricing.mockResolvedValue(
      pricing({
        promociones: [
          { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: true, condicion: "Martes" },
        ],
      }),
    );
    acciones.togglePromocion.mockRejectedValue(new Error("La promoción ya no existe."));
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    const fila = (await screen.findByText("2x1")).closest("div")!.parentElement!.parentElement!;
    await usuario.click([...fila.querySelectorAll("button")].at(-2)!);

    expect(await screen.findByText("La promoción ya no existe.")).toBeInTheDocument();
  });

  it("elimina una promoción", async () => {
    acciones.getPricing.mockResolvedValue(
      pricing({
        promociones: [
          { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: true, condicion: "Martes" },
        ],
      }),
    );
    acciones.deletePromocion.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<PricingPage espacios={[CANCHA]} />);
    const fila = (await screen.findByText("2x1")).closest("div")!.parentElement!.parentElement!;
    await usuario.click([...fila.querySelectorAll("button")].at(-1)!);

    await waitFor(() => expect(acciones.deletePromocion).toHaveBeenCalledWith(1, "p1"));
  });
});
