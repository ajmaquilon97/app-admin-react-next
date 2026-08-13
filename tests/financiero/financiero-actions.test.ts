/**
 * Server Actions del módulo financiero.
 *
 * Tres listados (ingresos, facturas SRI, reversos) comparten la misma traducción
 * de paginación 0-based → 1-based, y los reversos añaden un mapeo de estado en
 * ambos sentidos: el backend solo trackea notas de crédito, en minúsculas, y la
 * UI las muestra capitalizadas.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/lib/actions/catalogo-espacios", () => ({ getSpaceOptions: jest.fn() }));
jest.mock("@/modules/financiero/api/financiero", () => ({
  getResumen: jest.fn(),
  getIngresos: jest.fn(),
  getFacturas: jest.fn(),
  getReversos: jest.fn(),
  reintentarFactura: jest.fn(),
}));

import * as financieroApi from "@/modules/financiero/api/financiero";
import { getSessionTokens } from "@/lib/auth/session";
import { getSpaceOptions } from "@/lib/actions/catalogo-espacios";
import * as actions from "@/modules/financiero/actions/financiero";
import { espacioOption } from "../helpers/fixtures";

const api = jest.mocked(financieroApi);
const sesion = jest.mocked(getSessionTokens);
const catalogo = jest.mocked(getSpaceOptions);
const TOKEN = "tok";

const paged = <T>(items: T[], overrides = {}) => ({
  items,
  total: items.length,
  page: 0,
  pageSize: 10,
  totalPages: 1,
  ...overrides,
});

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
});

describe("getSummary", () => {
  it("expone las métricas del encabezado financiero", async () => {
    api.getResumen.mockResolvedValue({
      ingresosMes: 4200.5,
      variacionIngresos: 12,
      facturasAutorizadas: 34,
      facturasConError: 2,
      totalReversado: 180,
      serieIngresos: [{ fecha: "2026-03-01", monto: 120 }],
    } as never);

    await expect(actions.getSummary()).resolves.toEqual({
      ingresosMes: 4200.5,
      variacionIngresos: 12,
      facturasAutorizadas: 34,
      facturasConError: 2,
      totalReversado: 180,
      serieIngresos: [{ fecha: "2026-03-01", monto: 120 }],
    });
  });

  it("normaliza a arreglo vacío la serie que el backend omite", async () => {
    api.getResumen.mockResolvedValue({
      ingresosMes: 0,
      variacionIngresos: null,
      facturasAutorizadas: 0,
      facturasConError: 0,
      totalReversado: 0,
    } as never);

    const resumen = await actions.getSummary();
    expect(resumen.serieIngresos).toEqual([]);
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);
    await expect(actions.getSummary()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.getResumen).not.toHaveBeenCalled();
  });
});

describe("getIncome", () => {
  it("traduce la paginación y pasa los filtros de búsqueda y fecha", async () => {
    api.getIngresos.mockResolvedValue(paged([], { page: 1, total: 23, totalPages: 3 }) as never);

    const resultado = await actions.getIncome({
      search: "María",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
      page: 2,
    });

    expect(api.getIngresos).toHaveBeenCalledWith(
      { search: "María", dateFrom: "2026-03-01", dateTo: "2026-03-31", page: 1, size: 10 },
      TOKEN,
    );
    expect(resultado).toMatchObject({ page: 2, total: 23, totalPages: 3 });
  });

  it("usa página 1 y tamaño 10 por defecto", async () => {
    api.getIngresos.mockResolvedValue(paged([]) as never);

    await actions.getIncome();

    expect(api.getIngresos).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 10 }),
      TOKEN,
    );
  });

  it("mapea un ingreso ya facturado", async () => {
    api.getIngresos.mockResolvedValue(
      paged([
        {
          id: "i1",
          bookingId: "b1",
          bookingCode: "RES-1",
          clientName: "Ana",
          spaceId: "guid-1",
          spaceName: "Cancha",
          amount: 50,
          paymentMethod: "Tarjeta",
          paymentDate: "2026-03-10",
          invoiceStatus: "Autorizada",
          invoiceId: "f1",
        },
      ]) as never,
    );

    const { items } = await actions.getIncome();

    expect(items[0]).toMatchObject({ invoiceStatus: "Autorizada", invoiceId: "f1", amount: 50 });
  });

  it("tolera items nulos y conserva el tamaño pedido", async () => {
    api.getIngresos.mockResolvedValue(
      paged([], { items: null, pageSize: undefined }) as never,
    );

    const resultado = await actions.getIncome({ pageSize: 25 });

    expect(resultado.items).toEqual([]);
    expect(resultado.pageSize).toBe(25);
  });
});

describe("getInvoices", () => {
  it("pasa el filtro de estado tal cual al backend", async () => {
    api.getFacturas.mockResolvedValue(paged([]) as never);

    await actions.getInvoices({ status: "Autorizada", search: "1790" });

    expect(api.getFacturas).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Autorizada", search: "1790" }),
      TOKEN,
    );
  });

  it("mapea una factura autorizada con su RIDE", async () => {
    api.getFacturas.mockResolvedValue(
      paged([
        {
          id: "f1",
          bookingId: "b1",
          bookingCode: "RES-1",
          numeroComprobante: "001-001-000000123",
          claveAcceso: "1003202601179000000112345",
          clientName: "Ana",
          clientIdentification: "0912345678",
          fechaEmision: "2026-03-10",
          fechaAutorizacion: "2026-03-10",
          estado: "Autorizada",
          subtotal: 44.64,
          iva: 5.36,
          total: 50,
          ridePdfUrl: "https://sri.test/ride.pdf",
          motivoRechazo: null,
        },
      ]) as never,
    );

    const { items } = await actions.getInvoices();

    expect(items[0]).toMatchObject({
      numeroComprobante: "001-001-000000123",
      estado: "Autorizada",
      ridePdfUrl: "https://sri.test/ride.pdf",
      motivoRechazo: null,
    });
  });

  it("conserva el motivo de rechazo de una factura devuelta", async () => {
    api.getFacturas.mockResolvedValue(
      paged([
        {
          id: "f2",
          bookingId: "b2",
          bookingCode: "RES-2",
          numeroComprobante: "001-001-000000124",
          claveAcceso: "x",
          clientName: "Luis",
          clientIdentification: "0912345679",
          fechaEmision: "2026-03-11",
          fechaAutorizacion: null,
          estado: "Devuelta",
          subtotal: 10,
          iva: 1.2,
          total: 11.2,
          ridePdfUrl: null,
          motivoRechazo: "RUC del emisor no autorizado",
        },
      ]) as never,
    );

    const { items } = await actions.getInvoices();

    expect(items[0]!.motivoRechazo).toBe("RUC del emisor no autorizado");
    expect(items[0]!.fechaAutorizacion).toBeNull();
  });
});

describe("getReversals", () => {
  it.each([
    ["procesando", "Procesando"],
    ["enviada", "Enviada"],
    ["autorizada", "Autorizada"],
    ["rechazada", "Rechazada"],
    ["anulada", "Anulada"],
  ] as const)("mapea el estado %s → %s", async (estadoApi, esperado) => {
    api.getReversos.mockResolvedValue(
      paged([
        {
          id: "r1",
          facturaId: "f1",
          bookingId: "b1",
          bookingCode: "RES-1",
          clientName: "Ana",
          monto: 50,
          motivo: "Cancelación",
          estado: estadoApi,
          fechaSolicitud: "2026-03-10",
          fechaResolucion: null,
          claveAcceso: null,
        },
      ]) as never,
    );

    const { items } = await actions.getReversals();
    expect(items[0]!.estado).toBe(esperado);
  });

  it("traduce el filtro de estado de la UI al del backend", async () => {
    api.getReversos.mockResolvedValue(paged([]) as never);

    await actions.getReversals({ status: "Rechazada", dateFrom: "2026-03-01", dateTo: "2026-03-31" });

    expect(api.getReversos).toHaveBeenCalledWith(
      { estado: "rechazada", from: "2026-03-01", to: "2026-03-31", page: 0, size: 10 },
      TOKEN,
    );
  });

  it("no envía filtro de estado cuando la UI no selecciona ninguno", async () => {
    api.getReversos.mockResolvedValue(paged([]) as never);

    await actions.getReversals();

    expect(api.getReversos).toHaveBeenCalledWith(
      expect.objectContaining({ estado: undefined }),
      TOKEN,
    );
  });

  it("traduce la paginación 0-based del backend", async () => {
    api.getReversos.mockResolvedValue(paged([], { page: 2, totalPages: 4, total: 40 }) as never);

    const resultado = await actions.getReversals({ page: 3 });

    expect(resultado).toMatchObject({ page: 3, totalPages: 4, total: 40 });
  });
});

describe("retryInvoice", () => {
  it("devuelve el nuevo estado tras reintentar la emisión", async () => {
    api.reintentarFactura.mockResolvedValue({ id: "f2", estado: "Procesando" } as never);

    await expect(actions.retryInvoice("f2")).resolves.toEqual({ id: "f2", estado: "Procesando" });
    expect(api.reintentarFactura).toHaveBeenCalledWith("f2", TOKEN);
  });
});

describe("getFinancieroSpaces", () => {
  /**
   * El catálogo de espacios vive en `lib/actions`: si el módulo financiero lo
   * reimplementara, quedaría acoplado al de reservas (ver AGENTS.md, regla 1).
   */
  it("delega en el catálogo compartido en vez de componer el suyo", async () => {
    catalogo.mockResolvedValue([espacioOption()]);

    await expect(actions.getFinancieroSpaces()).resolves.toHaveLength(1);
    expect(catalogo).toHaveBeenCalled();
  });
});
