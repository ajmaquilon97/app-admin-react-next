/**
 * Componentes del módulo de tarifas.
 *
 * Dos comportamientos merecen prueba directa: que las modalidades ofrecidas
 * dependan del arquetipo del espacio —un espacio de cupo compartido solo cobra
 * "entrada", nunca "por hora"— y que la vista previa calcule el precio final
 * aplicando la promoción activa, que es el número que verá el cliente.
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
import { pricingKeys } from "@/modules/pricing/constants";
import { SpaceSelector } from "@/modules/pricing/components/SpaceSelector";
import { PricingModalities } from "@/modules/pricing/components/PricingModalities";
import { DailyRatesTable } from "@/modules/pricing/components/DailyRatesTable";
import { PricingPreview } from "@/modules/pricing/components/PricingPreview";
import {
  usePricing,
  useSavePricing,
  useAddFechaEspecial,
  useDeleteFechaEspecial,
  useAddPromocion,
  useTogglePromocion,
  useDeletePromocion,
} from "@/modules/pricing/hooks/usePricing";
import type { EspacioPricing } from "@/modules/pricing";
import { createTestQueryClient, renderHookWithQuery, renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(pricingActions);

const pricing = (o: Partial<EspacioPricing> = {}): EspacioPricing => ({
  espacioId: 1,
  modalidades: {
    hora: { activa: true, precio: 25 },
    jornada: { activa: false, precio: null },
    evento: { activa: false, precio: null },
    entrada: { activa: false, precio: null },
  },
  tarifasPorDia: [
    { dia: 0, activo: true, precio: 30 },
    { dia: 6, activo: false, precio: null },
  ],
  fechasEspeciales: [],
  promociones: [],
  ...o,
});

describe("SpaceSelector", () => {
  const espacios = [
    espacioOption({ id: 1, nombre: "Cancha Norte", tipoEspacioNombre: "Cancha de fútbol" }),
    espacioOption({ id: 2, nombre: "Piscina", tipoEspacioNombre: null }),
  ];

  it("muestra un marcador deshabilitado mientras no hay selección", () => {
    renderWithQuery(<SpaceSelector espacios={espacios} selected={null} onChange={jest.fn()} />);

    expect(screen.getByRole("option", { name: "Selecciona un espacio…" })).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("añade el tipo al nombre solo cuando existe", () => {
    renderWithQuery(<SpaceSelector espacios={espacios} selected={1} onChange={jest.fn()} />);

    expect(screen.getByRole("option", { name: "Cancha Norte · Cancha de fútbol" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Piscina" })).toBeInTheDocument();
  });

  it("devuelve el id como número", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<SpaceSelector espacios={espacios} selected={1} onChange={onChange} />);
    await usuario.selectOptions(screen.getByRole("combobox"), "2");

    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe("PricingModalities", () => {
  /** El arquetipo decide qué se puede cobrar: mezclarlos daría precios sin sentido. */
  it("ofrece hora, jornada y evento en franja exclusiva", () => {
    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={jest.fn()} archetype="franja_exclusiva" />,
    );

    expect(screen.getByText("Por Hora")).toBeInTheDocument();
    expect(screen.getByText("Por Jornada")).toBeInTheDocument();
    expect(screen.getByText("Por Evento")).toBeInTheDocument();
    expect(screen.queryByText("Por Entrada")).not.toBeInTheDocument();
  });

  it("ofrece solo entrada en cupo compartido", () => {
    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={jest.fn()} archetype="cupo_compartido" />,
    );

    expect(screen.getByText("Por Entrada")).toBeInTheDocument();
    expect(screen.queryByText("Por Hora")).not.toBeInTheDocument();
  });

  it("solo muestra el campo de precio en las modalidades activas", () => {
    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={jest.fn()} archetype="franja_exclusiva" />,
    );

    // Solo "hora" está activa.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
    expect(screen.getByRole("spinbutton")).toHaveValue(25);
  });

  it("activa una modalidad conservando el resto de la configuración", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={onChange} archetype="franja_exclusiva" />,
    );
    const interruptores = screen.getAllByRole("button");
    await usuario.click(interruptores[1]!); // jornada

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        modalidades: expect.objectContaining({
          hora: { activa: true, precio: 25 },
          jornada: { activa: true, precio: null },
        }),
      }),
    );
  });

  it("actualiza el precio de una modalidad", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={onChange} archetype="franja_exclusiva" />,
    );
    await usuario.type(screen.getByRole("spinbutton"), "0"); // 25 → 250

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        modalidades: expect.objectContaining({ hora: { activa: true, precio: 250 } }),
      }),
    );
  });

  it("vacía el precio como null en vez de NaN", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <PricingModalities pricing={pricing()} onChange={onChange} archetype="franja_exclusiva" />,
    );
    await usuario.clear(screen.getByRole("spinbutton"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        modalidades: expect.objectContaining({ hora: { activa: true, precio: null } }),
      }),
    );
  });
});

describe("DailyRatesTable", () => {
  it("nombra los días en español según su índice", () => {
    renderWithQuery(<DailyRatesTable pricing={pricing()} onChange={jest.fn()} />);

    expect(screen.getByText("Lunes")).toBeInTheDocument();
    expect(screen.getByText("Domingo")).toBeInTheDocument();
  });

  it("solo permite fijar precio en los días activos", () => {
    renderWithQuery(<DailyRatesTable pricing={pricing()} onChange={jest.fn()} />);

    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("activa un día sin tocar los demás", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<DailyRatesTable pricing={pricing()} onChange={onChange} />);
    const interruptores = screen.getAllByRole("button");
    await usuario.click(interruptores[1]!); // domingo

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tarifasPorDia: [
          { dia: 0, activo: true, precio: 30 },
          { dia: 6, activo: true, precio: null },
        ],
      }),
    );
  });

  it("el marcador del precio invita a heredar el precio base", () => {
    renderWithQuery(<DailyRatesTable pricing={pricing()} onChange={jest.fn()} />);

    expect(screen.getByPlaceholderText("Precio base")).toBeInTheDocument();
  });
});

describe("PricingPreview", () => {
  it("invita a elegir un espacio cuando no hay tarifas cargadas", () => {
    renderWithQuery(<PricingPreview pricing={null} espacioNombre={null} />);

    expect(
      screen.getByText("Selecciona un espacio para previsualizar tarifas."),
    ).toBeInTheDocument();
  });

  it("muestra el nombre del espacio y el precio de la modalidad activa", () => {
    renderWithQuery(<PricingPreview pricing={pricing()} espacioNombre="Cancha Norte" />);

    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument();
    expect(screen.getByText("/hora")).toBeInTheDocument();
  });

  it("avisa cuando el espacio no tiene ninguna modalidad activa", () => {
    renderWithQuery(
      <PricingPreview
        pricing={pricing({
          modalidades: {
            hora: { activa: false, precio: null },
            jornada: { activa: false, precio: null },
            evento: { activa: false, precio: null },
            entrada: { activa: false, precio: null },
          },
        })}
        espacioNombre="Cancha Norte"
      />,
    );

    expect(screen.getByText("Sin modalidades activas")).toBeInTheDocument();
  });

  /** El precio final es el que verá el cliente en el marketplace. */
  it("aplica un descuento porcentual sobre el precio base", () => {
    renderWithQuery(
      <PricingPreview
        pricing={pricing({
          promociones: [
            { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: true, condicion: "" },
          ],
        })}
        espacioNombre="Cancha Norte"
      />,
    );

    // 25 − 20% = 20.00
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
  });

  it("aplica un descuento de monto fijo", () => {
    renderWithQuery(
      <PricingPreview
        pricing={pricing({
          promociones: [
            { id: "p1", nombre: "Madrugador", tipo: "monto_fijo", valor: 5, activa: true, condicion: "" },
          ],
        })}
        espacioNombre="Cancha Norte"
      />,
    );

    // 25 − 5 = 20.00
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument();
  });

  it("ignora las promociones desactivadas", () => {
    const { container } = renderWithQuery(
      <PricingPreview
        pricing={pricing({
          promociones: [
            { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: false, condicion: "" },
          ],
        })}
        espacioNombre="Cancha Norte"
      />,
    );

    expect(container.textContent).not.toContain("$20.00");
  });
});

describe("hooks de tarifas", () => {
  it("usePricing no consulta sin espacio seleccionado", () => {
    const { result } = renderHookWithQuery(() => usePricing(null));

    expect(result.current.fetchStatus).toBe("idle");
    expect(acciones.getPricing).not.toHaveBeenCalled();
  });

  it("usePricing carga las tarifas del espacio", async () => {
    acciones.getPricing.mockResolvedValue(pricing());

    const { result } = renderHookWithQuery(() => usePricing(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(acciones.getPricing).toHaveBeenCalledWith(1);
  });

  /**
   * El PUT solo devuelve modalidades y tarifas por día. Si se sobrescribiera la
   * caché entera, las fechas especiales y promociones ya cargadas desaparecerían
   * de la pantalla hasta el siguiente refetch.
   */
  it("useSavePricing conserva en caché las fechas especiales y promociones", async () => {
    const guardado = pricing({
      modalidades: {
        hora: { activa: true, precio: 30 },
        jornada: { activa: false, precio: null },
        evento: { activa: false, precio: null },
        entrada: { activa: false, precio: null },
      },
      fechasEspeciales: [],
      promociones: [],
    });
    acciones.savePricing.mockResolvedValue(guardado);

    const previo = pricing({
      fechasEspeciales: [
        { id: "f1", fecha: "2026-12-25", descripcion: "Navidad", precio: 80, modalidad: "evento" },
      ],
      promociones: [
        { id: "p1", nombre: "2x1", tipo: "porcentaje", valor: 20, activa: true, condicion: "" },
      ],
    });

    const client = createTestQueryClient();
    const sembrar = jest.spyOn(client, "setQueryData");
    const { result } = renderHookWithQuery(() => useSavePricing(), { client });

    result.current.mutate(previo);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Se aplica el actualizador sobre lo que había en caché, en vez de releerla:
    // con `gcTime: 0` la entrada se descarta al quedarse sin observadores.
    expect(sembrar).toHaveBeenCalledWith(pricingKeys.byEspacio(1), expect.any(Function));
    const actualizar = sembrar.mock.calls[0]![1] as (
      old: EspacioPricing | undefined,
    ) => EspacioPricing;
    const fusionado = actualizar(previo);

    expect(fusionado.fechasEspeciales).toHaveLength(1);
    expect(fusionado.promociones).toHaveLength(1);
    expect(fusionado.modalidades.hora.precio).toBe(30);
  });

  it("useSavePricing cae en los datos enviados si la caché estaba vacía", async () => {
    acciones.savePricing.mockResolvedValue(pricing());
    const datos = pricing();

    const client = createTestQueryClient();
    const sembrar = jest.spyOn(client, "setQueryData");
    const { result } = renderHookWithQuery(() => useSavePricing(), { client });

    result.current.mutate(datos);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const actualizar = sembrar.mock.calls[0]![1] as (
      old: EspacioPricing | undefined,
    ) => EspacioPricing;
    expect(actualizar(undefined).espacioId).toBe(1);
  });

  it("useSavePricing envía solo modalidades y tarifas por día", async () => {
    acciones.savePricing.mockResolvedValue(pricing());
    const datos = pricing();

    const { result } = renderHookWithQuery(() => useSavePricing());

    result.current.mutate(datos);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.savePricing).toHaveBeenCalledWith(1, {
      modalidades: datos.modalidades,
      tarifasPorDia: datos.tarifasPorDia,
    });
  });

  it("useAddFechaEspecial refresca las tarifas del espacio", async () => {
    acciones.addFechaEspecial.mockResolvedValue({
      id: "f1",
      fecha: "2026-12-25",
      descripcion: "Navidad",
      precio: 80,
      modalidad: "evento",
    });

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useAddFechaEspecial(1), { client });

    result.current.mutate({
      fecha: "2026-12-25",
      descripcion: "Navidad",
      precio: 80,
      modalidad: "evento",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidar).toHaveBeenCalledWith({ queryKey: pricingKeys.byEspacio(1) });
  });

  it("useDeleteFechaEspecial elimina y refresca", async () => {
    acciones.deleteFechaEspecial.mockResolvedValue(undefined);

    const { result } = renderHookWithQuery(() => useDeleteFechaEspecial(1));

    result.current.mutate("f1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.deleteFechaEspecial).toHaveBeenCalledWith(1, "f1");
  });

  it("useAddPromocion crea la promoción del espacio", async () => {
    acciones.addPromocion.mockResolvedValue({
      id: "p1",
      nombre: "2x1",
      tipo: "porcentaje",
      valor: 20,
      activa: true,
      condicion: "",
    });

    const { result } = renderHookWithQuery(() => useAddPromocion(1));

    result.current.mutate({
      nombre: "2x1",
      tipo: "porcentaje",
      valor: 20,
      activa: true,
      condicion: "Martes",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.addPromocion).toHaveBeenCalledWith(1, expect.objectContaining({ nombre: "2x1" }));
  });

  it("useTogglePromocion activa y desactiva", async () => {
    acciones.togglePromocion.mockResolvedValue({
      id: "p1",
      nombre: "2x1",
      tipo: "porcentaje",
      valor: 20,
      activa: false,
      condicion: "",
    });

    const { result } = renderHookWithQuery(() => useTogglePromocion(1));

    result.current.mutate({ id: "p1", activa: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.togglePromocion).toHaveBeenCalledWith(1, "p1", false);
  });

  it("useDeletePromocion elimina y refresca", async () => {
    acciones.deletePromocion.mockResolvedValue(undefined);

    const client = createTestQueryClient();
    const invalidar = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHookWithQuery(() => useDeletePromocion(1), { client });

    result.current.mutate("p1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(acciones.deletePromocion).toHaveBeenCalledWith(1, "p1");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: pricingKeys.byEspacio(1) });
  });
});
