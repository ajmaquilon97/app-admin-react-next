/**
 * Aforo — control de cupo compartido.
 *
 * El detalle diario compone un id sintético por ticket (el backend solo manda
 * `reservaId`, que se repite entre días) y formatea la hora de compra. Ambas
 * cosas alimentan listas de React, así que la unicidad del id importa.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/modules/availability/api/aforo", () => ({
  getAforo: jest.fn(),
  getAforoDia: jest.fn(),
}));

import * as aforoApi from "@/modules/availability/api/aforo";
import { getSessionTokens } from "@/lib/auth/session";
import * as actions from "@/modules/availability/actions/aforo";

const api = jest.mocked(aforoApi);
const sesion = jest.mocked(getSessionTokens);
const TOKEN = "tok";

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
});

describe("fetchAforoSemana", () => {
  it("reduce la respuesta a los cuatro campos que consume la tira semanal", async () => {
    api.getAforo.mockResolvedValue([
      {
        fecha: "2026-03-10",
        capacidadTotal: 100,
        vendida: 62,
        disponible: 38,
        campoQueNoUsamos: "ignorar",
      },
    ] as never);

    const semana = await actions.fetchAforoSemana(1, "2026-03-09", "2026-03-15");

    expect(api.getAforo).toHaveBeenCalledWith(1, "2026-03-09", "2026-03-15", TOKEN);
    expect(semana).toEqual([
      { fecha: "2026-03-10", capacidadTotal: 100, vendida: 62, disponible: 38 },
    ]);
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);
    await expect(actions.fetchAforoSemana(1, "a", "b")).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.getAforo).not.toHaveBeenCalled();
  });
});

describe("fetchAforoDia", () => {
  it("compone un id único por ticket combinando fecha y reserva", async () => {
    api.getAforoDia.mockResolvedValue({
      fecha: "2026-03-10",
      capacidadTotal: 100,
      vendida: 5,
      disponible: 95,
      tickets: [
        { reservaId: 77, nombreCliente: "Ana", pax: 2, horaCompra: "2026-03-09T10:15:00Z" },
        { reservaId: 78, nombreCliente: "Luis", pax: 3, horaCompra: "2026-03-09T11:40:00Z" },
      ],
    } as never);

    const dia = await actions.fetchAforoDia(1, "2026-03-10");

    expect(dia.tickets.map((t) => t.id)).toEqual(["2026-03-10-77", "2026-03-10-78"]);
    expect(new Set(dia.tickets.map((t) => t.id)).size).toBe(2);
  });

  it("traduce los campos del ticket al vocabulario del portal", async () => {
    api.getAforoDia.mockResolvedValue({
      fecha: "2026-03-10",
      capacidadTotal: 50,
      vendida: 2,
      disponible: 48,
      tickets: [{ reservaId: 1, nombreCliente: "Ana", pax: 2, horaCompra: "2026-03-09T10:15:00Z" }],
    } as never);

    const dia = await actions.fetchAforoDia(1, "2026-03-10");

    expect(dia.tickets[0]).toMatchObject({ clienteNombre: "Ana", cantidad: 2 });
    expect(dia.tickets[0]!.hora).toMatch(/^\d{2}:\d{2}$/);
  });

  /** El backend devuelve `tickets: []` a quien no es dueño del espacio. */
  it("sobrevive a un detalle sin tickets", async () => {
    api.getAforoDia.mockResolvedValue({
      fecha: "2026-03-10",
      capacidadTotal: 100,
      vendida: 62,
      disponible: 38,
      tickets: [],
    } as never);

    const dia = await actions.fetchAforoDia(1, "2026-03-10");

    expect(dia.tickets).toEqual([]);
    expect(dia).toMatchObject({ capacidadTotal: 100, vendida: 62, disponible: 38 });
  });
});
