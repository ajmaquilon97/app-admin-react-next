/**
 * Módulo financiero — pestañas, indicadores y los tres listados.
 *
 * El foco está en lo que distingue a este módulo del resto: el reintento de
 * emisión, que solo debe ofrecerse en las facturas que el SRI puede reprocesar,
 * y el aislamiento de los filtros entre pestañas.
 */

jest.mock("@/modules/financiero/actions/financiero", () => ({
  getSummary: jest.fn(),
  getIncome: jest.fn(),
  getInvoices: jest.fn(),
  getReversals: jest.fn(),
  retryInvoice: jest.fn(),
  getFinancieroSpaces: jest.fn(),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as financieroActions from "@/modules/financiero/actions/financiero";
import { FinancieroModule } from "@/modules/financiero";
import { FinancialKPIs } from "@/modules/financiero/components/FinancialKPIs";
import { FinancialChart } from "@/modules/financiero/components/FinancialChart";
import { FinancialFiltersBar } from "@/modules/financiero/components/FinancialFiltersBar";
import { IngresosTable } from "@/modules/financiero/components/IngresosTable";
import { FacturasTable } from "@/modules/financiero/components/FacturasTable";
import { ReversosTable } from "@/modules/financiero/components/ReversosTable";
import type { IncomeEntry, Invoice, Reversal } from "@/modules/financiero";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const acciones = jest.mocked(financieroActions);

const paged = <T,>(items: T[], overrides = {}) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  ...overrides,
});

const ingreso = (o: Partial<IncomeEntry> = {}): IncomeEntry => ({
  id: "i1",
  bookingId: "b1",
  bookingCode: "RES-0101",
  clientName: "María Fernanda Pérez",
  spaceId: "guid-1",
  spaceName: "Cancha Norte",
  amount: 50,
  paymentMethod: "Tarjeta",
  paymentDate: "2026-03-10",
  invoiceStatus: "Autorizada",
  invoiceId: "f1",
  ...o,
});

const factura = (o: Partial<Invoice> = {}): Invoice => ({
  id: "f1",
  bookingId: "b1",
  bookingCode: "RES-0101",
  numeroComprobante: "001-001-000000123",
  claveAcceso: "1003202601179000000112345",
  clientName: "María Fernanda Pérez",
  clientIdentification: "0912345678",
  fechaEmision: "2026-03-10",
  fechaAutorizacion: "2026-03-10",
  estado: "Autorizada",
  subtotal: 44.64,
  iva: 5.36,
  total: 50,
  ridePdfUrl: "https://sri.test/ride.pdf",
  motivoRechazo: null,
  ...o,
});

const reverso = (o: Partial<Reversal> = {}): Reversal => ({
  id: "r1",
  facturaId: "f1",
  bookingId: "b1",
  bookingCode: "RES-0101",
  clientName: "María Fernanda Pérez",
  monto: 50,
  motivo: "Cancelación de reserva",
  estado: "Autorizada",
  fechaSolicitud: "2026-03-11",
  fechaResolucion: "2026-03-11",
  claveAcceso: "1103202601179000000112345",
  ...o,
});

beforeEach(() => {
  acciones.getSummary.mockResolvedValue({
    ingresosMes: 4200.5,
    variacionIngresos: 12,
    facturasAutorizadas: 34,
    facturasConError: 2,
    totalReversado: 180,
    serieIngresos: [
      { fecha: "2026-03-01", monto: 120 },
      { fecha: "2026-03-02", monto: 340 },
    ],
  });
  acciones.getIncome.mockResolvedValue(paged([ingreso()]));
  acciones.getInvoices.mockResolvedValue(paged([factura()]));
  acciones.getReversals.mockResolvedValue(paged([reverso()]));
  acciones.getFinancieroSpaces.mockResolvedValue([espacioOption()]);
});

describe("FinancialKPIs", () => {
  it("muestra los cuatro indicadores con importes a dos decimales", async () => {
    renderWithQuery(<FinancialKPIs />);

    expect(await screen.findByText("$4200.50")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("$180.00")).toBeInTheDocument();
  });

  it("señala que las facturas con error requieren revisión", async () => {
    renderWithQuery(<FinancialKPIs />);

    expect(await screen.findByText("Requieren revisión")).toBeInTheDocument();
  });

  it("dice 'Todo en orden' cuando no hay facturas con error", async () => {
    acciones.getSummary.mockResolvedValue({
      ingresosMes: 100,
      variacionIngresos: null,
      facturasAutorizadas: 5,
      facturasConError: 0,
      totalReversado: 0,
      serieIngresos: [],
    });

    renderWithQuery(<FinancialKPIs />);

    expect(await screen.findByText("Todo en orden")).toBeInTheDocument();
    expect(screen.getByText("Sin datos comparativos")).toBeInTheDocument();
  });

  it("muestra la variación mensual con signo", async () => {
    renderWithQuery(<FinancialKPIs />);

    expect(await screen.findByText("+12% vs mes anterior")).toBeInTheDocument();
  });
});

describe("FinancialChart", () => {
  it("dibuja una barra y una etiqueta por día de la serie", async () => {
    renderWithQuery(<FinancialChart />);

    expect(await screen.findByText("Ingresos — últimos 14 días")).toBeInTheDocument();
    expect(screen.getByText("01/03")).toBeInTheDocument();
    expect(screen.getByText("02/03")).toBeInTheDocument();
  });

  /**
   * La altura de cada barra es `monto / máximo` en porcentaje, con un mínimo del
   * 2% para que un día sin ingresos siga siendo visible en el eje.
   */
  it("escala la altura de cada barra respecto al día de mayor ingreso", async () => {
    acciones.getSummary.mockResolvedValue({
      ingresosMes: 0,
      variacionIngresos: null,
      facturasAutorizadas: 0,
      facturasConError: 0,
      totalReversado: 0,
      serieIngresos: [
        { fecha: "2026-03-01", monto: 100 },
        { fecha: "2026-03-02", monto: 50 },
        { fecha: "2026-03-03", monto: 0 },
      ],
    });

    const { container } = renderWithQuery(<FinancialChart />);
    await screen.findByText("01/03");

    const alturas = [...container.querySelectorAll<HTMLElement>('[style*="height"]')].map(
      (barra) => barra.style.height,
    );

    expect(alturas).toEqual(["100%", "50%", "2%"]);
  });

  it("sobrevive a una serie vacía sin dividir por cero", async () => {
    acciones.getSummary.mockResolvedValue({
      ingresosMes: 0,
      variacionIngresos: null,
      facturasAutorizadas: 0,
      facturasConError: 0,
      totalReversado: 0,
      serieIngresos: [],
    });

    renderWithQuery(<FinancialChart />);

    expect(await screen.findByText("Ingresos — últimos 14 días")).toBeInTheDocument();
  });
});

describe("FinancialFiltersBar", () => {
  const base = { filters: { page: 2, spaceId: 7 }, onChange: jest.fn() };

  it("oculta la búsqueda en las pestañas que el backend no soporta", () => {
    renderWithQuery(<FinancialFiltersBar {...base} showSearch={false} />);

    expect(screen.queryByPlaceholderText(/Buscar/)).not.toBeInTheDocument();
  });

  it("muestra el selector de estado solo si recibe opciones", () => {
    const { rerender } = renderWithQuery(<FinancialFiltersBar {...base} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    rerender(
      <FinancialFiltersBar
        {...base}
        statusOptions={[{ value: "Autorizada", label: "Autorizada" }]}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("aplica el rango de fechas y vuelve a la primera página", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(
      <FinancialFiltersBar {...base} onChange={onChange} />,
    );
    const fechas = container.querySelectorAll('input[type="date"]');
    await usuario.type(fechas[0] as HTMLInputElement, "2026-03-01");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: "2026-03-01", page: 1 }),
    );
  });

  it("conserva el espacio seleccionado al limpiar", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <FinancialFiltersBar
        filters={{ search: "x", dateFrom: "2026-03-01", spaceId: 7, page: 3 }}
        onChange={onChange}
      />,
    );
    await usuario.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(onChange).toHaveBeenCalledWith({ page: 1, spaceId: 7 });
  });
});

describe("IngresosTable", () => {
  const props = { filters: {}, onChangeFilters: jest.fn() };

  it("lista los ingresos con su importe y estado de factura", async () => {
    renderWithQuery(<IngresosTable {...props} />);

    expect(await screen.findByText("RES-0101")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("Autorizada")).toBeInTheDocument();
  });

  it("marca como 'Sin facturar' un ingreso sin comprobante", async () => {
    acciones.getIncome.mockResolvedValue(
      paged([ingreso({ invoiceStatus: null, invoiceId: null })]),
    );

    renderWithQuery(<IngresosTable {...props} />);

    expect(await screen.findByText("Sin facturar")).toBeInTheDocument();
  });

  it("muestra el vacío del rango de fechas", async () => {
    acciones.getIncome.mockResolvedValue(paged([]));

    renderWithQuery(<IngresosTable {...props} />);

    expect(await screen.findByText("No hay ingresos en este rango")).toBeInTheDocument();
  });

  it("informa del fallo de carga", async () => {
    acciones.getIncome.mockRejectedValue(new Error("500"));

    renderWithQuery(<IngresosTable {...props} />);

    expect(await screen.findByText("Error al cargar los ingresos.")).toBeInTheDocument();
  });

  it("avanza de página y deshabilita 'Anterior' en la primera", async () => {
    const onChangeFilters = jest.fn();
    acciones.getIncome.mockResolvedValue(paged([ingreso()], { total: 23, totalPages: 3 }));
    const usuario = userEvent.setup();

    renderWithQuery(<IngresosTable filters={{ page: 1 }} onChangeFilters={onChangeFilters} />);
    await screen.findByText("23 ingresos en total");

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await usuario.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onChangeFilters).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("deshabilita 'Siguiente' en la última página", async () => {
    acciones.getIncome.mockResolvedValue(
      paged([ingreso()], { page: 3, total: 23, totalPages: 3 }),
    );

    renderWithQuery(<IngresosTable filters={{ page: 3 }} onChangeFilters={jest.fn()} />);
    await screen.findByText("23 ingresos en total");

    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});

describe("FacturasTable", () => {
  const props = { filters: {}, onChangeFilters: jest.fn() };

  it("lista la factura con su número, clave de acceso y total", async () => {
    renderWithQuery(<FacturasTable {...props} />);

    expect(await screen.findByText("001-001-000000123")).toBeInTheDocument();
    expect(screen.getByText("1003202601179000000112345")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("ofrece descargar el RIDE cuando el SRI lo devolvió", async () => {
    renderWithQuery(<FacturasTable {...props} />);

    expect(await screen.findByTitle("Descargar RIDE (PDF)")).toHaveAttribute(
      "href",
      "https://sri.test/ride.pdf",
    );
  });

  it("no ofrece descarga si aún no hay RIDE", async () => {
    acciones.getInvoices.mockResolvedValue(
      paged([factura({ ridePdfUrl: null, estado: "Procesando", fechaAutorizacion: null })]),
    );

    renderWithQuery(<FacturasTable {...props} />);
    await screen.findByText("001-001-000000123");

    expect(screen.queryByTitle("Descargar RIDE (PDF)")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  /** Reintentar solo tiene sentido en los estados que el SRI permite reprocesar. */
  it.each(["Devuelta", "Error"] as const)(
    "ofrece reintentar la emisión de una factura %s",
    async (estado) => {
      acciones.getInvoices.mockResolvedValue(paged([factura({ estado, ridePdfUrl: null })]));

      renderWithQuery(<FacturasTable {...props} />);

      expect(await screen.findByTitle("Reintentar emisión")).toBeInTheDocument();
    },
  );

  it.each(["Autorizada", "Procesando", "Recibida", "No autorizada"] as const)(
    "no ofrece reintentar una factura %s",
    async (estado) => {
      acciones.getInvoices.mockResolvedValue(paged([factura({ estado })]));

      renderWithQuery(<FacturasTable {...props} />);
      await screen.findByText("001-001-000000123");

      expect(screen.queryByTitle("Reintentar emisión")).not.toBeInTheDocument();
    },
  );

  it("reintenta la emisión al pulsar el botón", async () => {
    acciones.getInvoices.mockResolvedValue(paged([factura({ estado: "Error", ridePdfUrl: null })]));
    acciones.retryInvoice.mockResolvedValue({ id: "f1", estado: "Procesando" });
    const usuario = userEvent.setup();

    renderWithQuery(<FacturasTable {...props} />);
    await usuario.click(await screen.findByTitle("Reintentar emisión"));

    await waitFor(() => expect(acciones.retryInvoice).toHaveBeenCalledWith("f1"));
  });

  it("muestra el motivo de rechazo como ayuda del estado", async () => {
    acciones.getInvoices.mockResolvedValue(
      paged([factura({ estado: "Devuelta", motivoRechazo: "RUC no autorizado", ridePdfUrl: null })]),
    );

    renderWithQuery(<FacturasTable {...props} />);

    expect(await screen.findByTitle("RUC no autorizado")).toBeInTheDocument();
  });

  it("muestra el vacío y el error de carga", async () => {
    acciones.getInvoices.mockResolvedValue(paged([]));
    const { unmount } = renderWithQuery(<FacturasTable {...props} />);
    expect(await screen.findByText("No hay facturas en este rango")).toBeInTheDocument();
    unmount();

    acciones.getInvoices.mockRejectedValue(new Error("500"));
    renderWithQuery(<FacturasTable {...props} />);
    expect(await screen.findByText("Error al cargar las facturas.")).toBeInTheDocument();
  });
});

describe("ReversosTable", () => {
  const props = { filters: {}, onChangeFilters: jest.fn() };

  it("lista el reverso con su motivo, monto y estado", async () => {
    renderWithQuery(<ReversosTable {...props} />);

    expect(await screen.findByText("Cancelación de reserva")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("Autorizada")).toBeInTheDocument();
  });

  it("explica el vacío mencionando de dónde salen los reversos", async () => {
    acciones.getReversals.mockResolvedValue(paged([]));

    renderWithQuery(<ReversosTable {...props} />);

    expect(await screen.findByText("No hay reversos en este rango")).toBeInTheDocument();
    expect(
      screen.getByText(/anulaciones de factura y reembolsos por cancelación/i),
    ).toBeInTheDocument();
  });

  it("informa del fallo de carga", async () => {
    acciones.getReversals.mockRejectedValue(new Error("500"));

    renderWithQuery(<ReversosTable {...props} />);

    expect(await screen.findByText("Error al cargar los reversos.")).toBeInTheDocument();
  });

  it("pagina los reversos", async () => {
    const onChangeFilters = jest.fn();
    acciones.getReversals.mockResolvedValue(paged([reverso()], { total: 12, totalPages: 2 }));
    const usuario = userEvent.setup();

    renderWithQuery(<ReversosTable filters={{ page: 1 }} onChangeFilters={onChangeFilters} />);
    await usuario.click(await screen.findByRole("button", { name: "Siguiente" }));

    expect(onChangeFilters).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });
});

describe("FinancieroModule", () => {
  it("abre en la pestaña de resumen con el gráfico", async () => {
    renderWithQuery(<FinancieroModule />);

    expect(screen.getByRole("heading", { name: "Financiero", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Ingresos — últimos 14 días")).toBeInTheDocument();
  });

  it.each([
    ["Ingresos", "RES-0101"],
    ["Facturas", "001-001-000000123"],
    ["Reversos", "Cancelación de reserva"],
  ])("navega a la pestaña %s", async (pestana, textoEsperado) => {
    const usuario = userEvent.setup();

    renderWithQuery(<FinancieroModule />);
    await usuario.click(screen.getByRole("button", { name: pestana }));

    expect(await screen.findByText(textoEsperado)).toBeInTheDocument();
  });

  /**
   * "Estado" significa cosas distintas en Facturas y en Reversos: arrastrar el
   * filtro entre pestañas produciría una consulta con un valor que la otra API
   * no reconoce.
   */
  it("descarta los filtros al cambiar de pestaña pero conserva el espacio", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<FinancieroModule />);

    const opcion = await screen.findByRole("option", { name: /Cancha Norte/ });
    await usuario.selectOptions(opcion.closest("select")!, "1");

    await usuario.click(screen.getByRole("button", { name: "Facturas" }));
    await usuario.type(
      await screen.findByPlaceholderText("Buscar cliente, No. o clave de acceso..."),
      "Ana",
    );
    await waitFor(() =>
      expect(acciones.getInvoices).toHaveBeenCalledWith(expect.objectContaining({ search: "Ana" })),
    );

    await usuario.click(screen.getByRole("button", { name: "Reversos" }));

    await waitFor(() =>
      expect(acciones.getReversals).toHaveBeenCalledWith({ page: 1, spaceId: 1 }),
    );
  });

  it("mantiene los KPIs visibles en todas las pestañas", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<FinancieroModule />);
    await screen.findByText("$4200.50");

    await usuario.click(screen.getByRole("button", { name: "Reversos" }));

    expect(screen.getByText("$4200.50")).toBeInTheDocument();
  });
});
