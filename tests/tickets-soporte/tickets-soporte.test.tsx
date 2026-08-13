/**
 * Módulo de tickets de soporte.
 *
 * Aprobar un ticket no es una acción cosmética: dispara el reverso automático
 * (nota de crédito) de la reserva. Las pruebas fijan que esa consecuencia se
 * advierta antes de confirmar, que solo los tickets aún abiertos sean
 * resolubles y que la resolución exija notas.
 *
 * Además, este módulo consume el envelope Pageable de Spring
 * (`content`/`totalElements`/`number`), distinto del formato aplanado que usa
 * reservas: el mapeo se prueba explícitamente.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/modules/tickets-soporte/api/tickets-soporte", () => ({
  listTicketsSoporte: jest.fn(),
  resolverTicket: jest.fn(),
}));

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import * as ticketsApi from "@/modules/tickets-soporte/api/tickets-soporte";
import { getSessionTokens } from "@/lib/auth/session";
import * as actions from "@/modules/tickets-soporte/actions/tickets-soporte";
import { ticketsKeys } from "@/modules/tickets-soporte/constants";
import { TicketsSoporteModule } from "@/modules/tickets-soporte";
import { ResolverTicketDialog } from "@/modules/tickets-soporte/components/ResolverTicketDialog";
import type { TicketEstado, TicketSoporte } from "@/modules/tickets-soporte";
import { renderWithQuery } from "../helpers/render";

const api = jest.mocked(ticketsApi);
const sesion = jest.mocked(getSessionTokens);
const avisos = jest.mocked(toast);
const TOKEN = "tok";

const ticketApi = (o: Record<string, unknown> = {}) => ({
  id: "t1",
  reservaId: 101,
  reservaCodigo: "RES-0101",
  clienteNombre: "María Fernanda Pérez",
  descripcion: "El espacio estaba cerrado al llegar",
  estado: "abierto",
  resolucionNotas: null,
  fechaCreacion: "2026-03-10T09:00:00",
  resueltoAt: null,
  ...o,
});

const pageable = (content: unknown[], o: Record<string, unknown> = {}) => ({
  content,
  totalElements: content.length,
  number: 0,
  totalPages: 1,
  ...o,
});

const ticket = (o: Partial<TicketSoporte> = {}): TicketSoporte => ({
  id: "t1",
  reservaId: 101,
  reservaCodigo: "RES-0101",
  clienteNombre: "María Fernanda Pérez",
  descripcion: "El espacio estaba cerrado al llegar",
  estado: "abierto",
  estadoLabel: "Abierto",
  resolucionNotas: null,
  fechaCreacion: "2026-03-10T09:00:00",
  fechaResolucion: null,
  ...o,
});

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
  api.listTicketsSoporte.mockResolvedValue(pageable([ticketApi()]) as never);
});

describe("getTicketsSoporte", () => {
  it.each([
    ["abierto", "Abierto"],
    ["en_revision", "En revisión"],
    ["aprobado", "Aprobado"],
    ["rechazado", "Rechazado"],
  ] as const)("traduce el estado %s a la etiqueta '%s'", async (estado, etiqueta) => {
    api.listTicketsSoporte.mockResolvedValue(pageable([ticketApi({ estado })]) as never);

    const { items } = await actions.getTicketsSoporte();

    expect(items[0]!.estado).toBe(estado);
    expect(items[0]!.estadoLabel).toBe(etiqueta);
  });

  /** El backend usa el envelope Pageable de Spring, no el formato aplanado de reservas. */
  it("traduce el envelope Pageable de Spring a la respuesta paginada del portal", async () => {
    api.listTicketsSoporte.mockResolvedValue(
      pageable([ticketApi()], { number: 2, totalElements: 47, totalPages: 3 }) as never,
    );

    const resultado = await actions.getTicketsSoporte({ page: 3 });

    expect(resultado).toMatchObject({ page: 3, total: 47, totalPages: 3, pageSize: 20 });
    expect(api.listTicketsSoporte).toHaveBeenCalledWith(
      { estado: undefined, page: 2, size: 20 },
      TOKEN,
    );
  });

  it("tolera un contenido nulo", async () => {
    api.listTicketsSoporte.mockResolvedValue(pageable([], { content: null }) as never);

    await expect(actions.getTicketsSoporte()).resolves.toMatchObject({ items: [] });
  });

  it("no envía filtro de estado cuando la UI elige 'todos'", async () => {
    await actions.getTicketsSoporte({ estado: "" });

    expect(api.listTicketsSoporte).toHaveBeenCalledWith(
      expect.objectContaining({ estado: undefined }),
      TOKEN,
    );
  });

  it("pasa el filtro de estado cuando sí se selecciona", async () => {
    await actions.getTicketsSoporte({ estado: "en_revision" });

    expect(api.listTicketsSoporte).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "en_revision" }),
      TOKEN,
    );
  });

  it("sustituye el código y el nombre ausentes por respaldos legibles", async () => {
    api.listTicketsSoporte.mockResolvedValue(
      pageable([ticketApi({ reservaCodigo: null, clienteNombre: null, reservaId: 55 })]) as never,
    );

    const { items } = await actions.getTicketsSoporte();

    expect(items[0]!.reservaCodigo).toBe("RES-55");
    expect(items[0]!.clienteNombre).toBe("Cliente sin nombre");
  });

  it("renombra resueltoAt a fechaResolucion", async () => {
    api.listTicketsSoporte.mockResolvedValue(
      pageable([ticketApi({ estado: "aprobado", resueltoAt: "2026-03-12T10:00:00" })]) as never,
    );

    const { items } = await actions.getTicketsSoporte();
    expect(items[0]!.fechaResolucion).toBe("2026-03-12T10:00:00");
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(actions.getTicketsSoporte()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.listTicketsSoporte).not.toHaveBeenCalled();
  });
});

describe("resolveTicket", () => {
  it("envía la decisión y las notas, y devuelve el ticket ya mapeado", async () => {
    api.resolverTicket.mockResolvedValue(
      ticketApi({ estado: "aprobado", resolucionNotas: "Procede el reembolso" }) as never,
    );

    const resuelto = await actions.resolveTicket("t1", true, "Procede el reembolso");

    expect(api.resolverTicket).toHaveBeenCalledWith(
      "t1",
      { aprobado: true, notas: "Procede el reembolso" },
      TOKEN,
    );
    expect(resuelto.estadoLabel).toBe("Aprobado");
  });

  it("permite rechazar el ticket", async () => {
    api.resolverTicket.mockResolvedValue(ticketApi({ estado: "rechazado" }) as never);

    const resuelto = await actions.resolveTicket("t1", false, "No procede");

    expect(api.resolverTicket).toHaveBeenCalledWith(
      "t1",
      { aprobado: false, notas: "No procede" },
      TOKEN,
    );
    expect(resuelto.estado).toBe("rechazado");
  });
});

describe("ticketsKeys", () => {
  it("permite invalidar todas las listas con un solo prefijo", () => {
    expect(ticketsKeys.list({ page: 1 })[0]).toBe(ticketsKeys.all[0]);
    expect(ticketsKeys.list({ page: 1 })).not.toEqual(ticketsKeys.list({ page: 2 }));
  });
});

describe("ResolverTicketDialog", () => {
  const props = {
    ticket: ticket(),
    aprobado: true,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
    loading: false,
  };

  /** La consecuencia económica se declara antes de confirmar, no después. */
  it("advierte que aprobar dispara el reverso automático", () => {
    renderWithQuery(<ResolverTicketDialog {...props} />);

    expect(screen.getByText("Aprobar ticket")).toBeInTheDocument();
    expect(screen.getByText(/se dispara automáticamente el reverso/i)).toBeInTheDocument();
  });

  it("no muestra esa advertencia al rechazar", () => {
    renderWithQuery(<ResolverTicketDialog {...props} aprobado={false} />);

    expect(screen.getByText("Rechazar ticket")).toBeInTheDocument();
    expect(screen.queryByText(/se dispara automáticamente el reverso/i)).not.toBeInTheDocument();
  });

  it("mantiene el envío bloqueado mientras no haya notas", () => {
    renderWithQuery(<ResolverTicketDialog {...props} />);

    expect(screen.getByRole("button", { name: "Confirmar aprobación" })).toBeDisabled();
  });

  it("avisa cuando las notas son demasiado cortas", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ResolverTicketDialog {...props} />);
    await usuario.type(screen.getByRole("textbox"), "no");

    expect(screen.getByText("Mínimo 5 caracteres.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar aprobación" })).toBeDisabled();
  });

  it("habilita y envía las notas recortadas cuando son suficientes", async () => {
    const onConfirm = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ResolverTicketDialog {...props} onConfirm={onConfirm} />);
    await usuario.type(screen.getByRole("textbox"), "  Procede el reembolso  ");
    await usuario.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    expect(onConfirm).toHaveBeenCalledWith("Procede el reembolso");
  });

  it("bloquea el envío mientras la resolución está en curso", () => {
    renderWithQuery(<ResolverTicketDialog {...props} loading />);

    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
  });

  it("cierra sin resolver", async () => {
    const onClose = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ResolverTicketDialog {...props} onClose={onClose} />);
    await usuario.click(screen.getByRole("button", { name: "Volver" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("TicketsSoporteModule", () => {
  it("lista los tickets con su reserva, cliente y estado", async () => {
    renderWithQuery(<TicketsSoporteModule />);

    expect(await screen.findByText("RES-0101")).toBeInTheDocument();
    expect(screen.getByText("María Fernanda Pérez")).toBeInTheDocument();
    // "Abierto" también existe como opción del filtro: se busca dentro de la tabla.
    expect(within(screen.getByRole("table")).getByText("Abierto")).toBeInTheDocument();
  });

  it("muestra el vacío del filtro aplicado", async () => {
    api.listTicketsSoporte.mockResolvedValue(pageable([]) as never);

    renderWithQuery(<TicketsSoporteModule />);

    expect(await screen.findByText("No hay tickets")).toBeInTheDocument();
    expect(screen.getByText("No se encontraron incidencias con ese filtro.")).toBeInTheDocument();
  });

  it("informa del fallo de carga", async () => {
    api.listTicketsSoporte.mockRejectedValue(new Error("500"));

    renderWithQuery(<TicketsSoporteModule />);

    expect(await screen.findByText("Error al cargar los tickets de soporte.")).toBeInTheDocument();
  });

  it("filtra por estado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<TicketsSoporteModule />);
    await screen.findByText("RES-0101");
    await usuario.selectOptions(screen.getByRole("combobox"), "aprobado");

    await waitFor(() =>
      expect(api.listTicketsSoporte).toHaveBeenCalledWith(
        expect.objectContaining({ estado: "aprobado" }),
        TOKEN,
      ),
    );
  });

  it.each(["abierto", "en_revision"] as const)(
    "permite resolver un ticket %s",
    async (estado) => {
      api.listTicketsSoporte.mockResolvedValue(pageable([ticketApi({ estado })]) as never);

      renderWithQuery(<TicketsSoporteModule />);

      expect(await screen.findByTitle("Aprobar")).toBeInTheDocument();
      expect(screen.getByTitle("Rechazar")).toBeInTheDocument();
    },
  );

  it.each(["aprobado", "rechazado"] as const)(
    "no permite volver a resolver un ticket %s",
    async (estado: TicketEstado) => {
      api.listTicketsSoporte.mockResolvedValue(pageable([ticketApi({ estado })]) as never);

      renderWithQuery(<TicketsSoporteModule />);
      await screen.findByText("RES-0101");

      expect(screen.queryByTitle("Aprobar")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Rechazar")).not.toBeInTheDocument();
    },
  );

  it("aprueba un ticket de extremo a extremo y confirma el reverso", async () => {
    api.resolverTicket.mockResolvedValue(ticketApi({ estado: "aprobado" }) as never);
    const usuario = userEvent.setup();

    renderWithQuery(<TicketsSoporteModule />);
    await usuario.click(await screen.findByTitle("Aprobar"));
    await usuario.type(await screen.findByRole("textbox"), "Procede el reembolso");
    await usuario.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    await waitFor(() =>
      expect(api.resolverTicket).toHaveBeenCalledWith(
        "t1",
        { aprobado: true, notas: "Procede el reembolso" },
        TOKEN,
      ),
    );
    expect(avisos.success).toHaveBeenCalledWith("Ticket aprobado — reverso disparado.");
  });

  it("rechaza un ticket con un aviso distinto", async () => {
    api.resolverTicket.mockResolvedValue(ticketApi({ estado: "rechazado" }) as never);
    const usuario = userEvent.setup();

    renderWithQuery(<TicketsSoporteModule />);
    await usuario.click(await screen.findByTitle("Rechazar"));
    await usuario.type(await screen.findByRole("textbox"), "No procede la incidencia");
    await usuario.click(screen.getByRole("button", { name: "Confirmar rechazo" }));

    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith("Ticket rechazado."));
  });

  it("reporta el fallo al resolver", async () => {
    api.resolverTicket.mockRejectedValue(new Error("El ticket ya fue resuelto"));
    const usuario = userEvent.setup();

    renderWithQuery(<TicketsSoporteModule />);
    await usuario.click(await screen.findByTitle("Aprobar"));
    await usuario.type(await screen.findByRole("textbox"), "Procede el reembolso");
    await usuario.click(screen.getByRole("button", { name: "Confirmar aprobación" }));

    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith("El ticket ya fue resuelto"));
  });

  it("muestra la paginación cuando hay más de una página", async () => {
    api.listTicketsSoporte.mockResolvedValue(
      pageable([ticketApi()], { totalElements: 42, totalPages: 3 }) as never,
    );

    renderWithQuery(<TicketsSoporteModule />);

    expect(await screen.findByText("42 tickets en total")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });
});
