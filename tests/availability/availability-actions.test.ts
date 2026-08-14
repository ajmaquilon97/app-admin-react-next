/**
 * Server Actions del módulo de disponibilidad.
 *
 * Concentran dos conversiones fáciles de romper y difíciles de detectar a simple
 * vista: la numeración de los días de la semana (el backend arranca en domingo,
 * el portal en lunes) y el formato de hora (`HH:mm:ss` ↔ `HH:mm`). Un error en
 * cualquiera de las dos desplaza el horario de apertura de un espacio entero,
 * así que se prueban ida y vuelta.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/modules/availability/api/availability", () => ({
  getAvailability: jest.fn(),
  getStatistics: jest.fn(),
  getSchedule: jest.fn(),
  putSchedule: jest.fn(),
  getExceptions: jest.fn(),
  postException: jest.fn(),
  putException: jest.fn(),
  deleteException: jest.fn(),
  postBlock: jest.fn(),
  deleteBlock: jest.fn(),
}));

import * as availabilityApi from "@/modules/availability/api/availability";
import { getSessionTokens } from "@/lib/auth/session";
import * as actions from "@/modules/availability/actions/availability";

const api = jest.mocked(availabilityApi);
const sesion = jest.mocked(getSessionTokens);
const TOKEN = "tok";

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
});

describe("fetchServerNow", () => {
  /** La grilla marca "horas ya pasadas" con esta hora, no con la del navegador. */
  it("devuelve una marca ISO del reloj del servidor", async () => {
    const ahora = await actions.fetchServerNow();
    expect(ahora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe("fetchAvailability", () => {
  it("mapea los slots del backend a bloques del dominio", async () => {
    api.getAvailability.mockResolvedValue([
      {
        id: "s1",
        espacioId: 1,
        espacioNombre: "Cancha Norte",
        fecha: "2026-03-10",
        hora: 14,
        estado: "reserved",
        notas: null,
        clienteNombre: "Ana",
      },
    ] as never);

    const bloques = await actions.fetchAvailability("2026-03-09", "2026-03-15", 1);

    expect(api.getAvailability).toHaveBeenCalledWith(
      { fechaInicio: "2026-03-09", fechaFin: "2026-03-15", espacioId: 1 },
      TOKEN,
    );
    expect(bloques[0]).toEqual({
      id: "s1",
      espacioId: 1,
      espacioNombre: "Cancha Norte",
      date: "2026-03-10",
      hour: 14,
      status: "reserved",
      clientName: "Ana",
      notes: null,
    });
  });

  it("deja clientName indefinido en un bloqueo sin cliente", async () => {
    api.getAvailability.mockResolvedValue([
      {
        id: "b1",
        espacioId: 1,
        espacioNombre: "Cancha Norte",
        fecha: "2026-03-10",
        hora: 9,
        estado: "blocked",
        notas: "Mantenimiento",
      },
    ] as never);

    const [bloque] = await actions.fetchAvailability("2026-03-09", "2026-03-15");
    expect(bloque!.clientName).toBeUndefined();
    expect(bloque!.notes).toBe("Mantenimiento");
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);
    await expect(actions.fetchAvailability("a", "b")).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(api.getAvailability).not.toHaveBeenCalled();
  });
});

describe("fetchAvailabilityStatistics", () => {
  it("renombra las métricas del backend al vocabulario del portal", async () => {
    api.getStatistics.mockResolvedValue({
      disponibles: 40,
      reservadas: 18,
      bloqueadas: 2,
      porcentajeOcupacion: 30,
    } as never);

    await expect(
      actions.fetchAvailabilityStatistics("2026-03-09", "2026-03-15", 1),
    ).resolves.toEqual({
      horasDisponibles: 40,
      horasReservadas: 18,
      horasBloqueadas: 2,
      ocupacion: 30,
    });
  });
});

describe("horario general — conversión de días y horas", () => {
  /**
   * Backend: 0=Dom, 1=Lun … 6=Sáb. Portal: 0=Lun, 1=Mar … 6=Dom.
   * Se fija la tabla completa porque un off-by-one aquí mueve el horario un día.
   */
  it.each([
    [0, 6],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 4],
    [6, 5],
  ])("traduce el día %i del backend al día %i del portal", async (diaBackend, diaUi) => {
    api.getSchedule.mockResolvedValue({
      espacioId: 1,
      apertura: "08:00:00",
      cierre: "22:00:00",
      diasActivos: [diaBackend],
    } as never);

    const horario = await actions.fetchSchedule(1);
    expect(horario.diasActivos).toEqual([diaUi]);
  });

  it("recorta los segundos de las horas del backend", async () => {
    api.getSchedule.mockResolvedValue({
      espacioId: 1,
      apertura: "08:30:00",
      cierre: "21:45:00",
      diasActivos: [1, 2],
    } as never);

    const horario = await actions.fetchSchedule(1);
    expect(horario.apertura).toBe("08:30");
    expect(horario.cierre).toBe("21:45");
  });

  it("aplica un horario por defecto si el espacio aún no tiene uno", async () => {
    api.getSchedule.mockResolvedValue(null as never);

    await expect(actions.fetchSchedule(7)).resolves.toEqual({
      apertura: "08:00",
      cierre: "22:00",
      diasActivos: [0, 1, 2, 3, 4, 5, 6],
      espacioId: 7,
    });
  });

  it("al guardar vuelve a la numeración del backend y añade los segundos", async () => {
    api.putSchedule.mockResolvedValue({
      espacioId: 1,
      apertura: "09:00:00",
      cierre: "20:00:00",
      diasActivos: [1, 2, 3, 4, 5],
    } as never);

    await actions.saveSchedule({
      espacioId: 1,
      apertura: "09:00",
      cierre: "20:00",
      diasActivos: [0, 1, 2, 3, 4], // Lun–Vie en la convención del portal
    });

    expect(api.putSchedule).toHaveBeenCalledWith(
      {
        espacioId: 1,
        apertura: "09:00:00",
        cierre: "20:00:00",
        diasActivos: [1, 2, 3, 4, 5], // Lun–Vie en la convención del backend
      },
      TOKEN,
    );
  });

  it("no vuelve a añadir segundos a una hora que ya los trae", async () => {
    api.putSchedule.mockResolvedValue({
      espacioId: 1,
      apertura: "09:00:00",
      cierre: "20:00:00",
      diasActivos: [],
    } as never);

    await actions.saveSchedule({
      espacioId: 1,
      apertura: "09:00:00",
      cierre: "20:00:00",
      diasActivos: [],
    });

    expect(api.putSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ apertura: "09:00:00", cierre: "20:00:00" }),
      TOKEN,
    );
  });

  /** Ida y vuelta completa: guardar lo que se leyó no debe alterar los días. */
  it("es reversible: leer y volver a guardar conserva los días activos", async () => {
    const diasBackend = [1, 3, 5];
    api.getSchedule.mockResolvedValue({
      espacioId: 2,
      apertura: "08:00:00",
      cierre: "22:00:00",
      diasActivos: diasBackend,
    } as never);
    api.putSchedule.mockResolvedValue({
      espacioId: 2,
      apertura: "08:00:00",
      cierre: "22:00:00",
      diasActivos: diasBackend,
    } as never);

    const leido = await actions.fetchSchedule(2);
    await actions.saveSchedule({ ...leido, espacioId: 2 });

    expect(api.putSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ diasActivos: diasBackend }),
      TOKEN,
    );
  });
});

describe("excepciones de calendario", () => {
  it("recorta las horas y conserva el tipo", async () => {
    api.getExceptions.mockResolvedValue([
      {
        id: "e1",
        titulo: "Feriado nacional",
        fecha: "2026-05-24",
        horaInicio: "00:00:00",
        horaFin: "23:59:00",
        tipo: "feriado",
      },
    ] as never);

    const [excepcion] = await actions.fetchExceptions(1);

    expect(excepcion).toEqual({
      id: "e1",
      titulo: "Feriado nacional",
      fecha: "2026-05-24",
      horaInicio: "00:00",
      horaFin: "23:59",
      tipo: "feriado",
    });
  });

  it("deja las horas indefinidas en una excepción de día completo", async () => {
    api.getExceptions.mockResolvedValue([
      { id: "e2", titulo: "Cierre", fecha: "2026-06-01", horaInicio: null, horaFin: null, tipo: "cierre" },
    ] as never);

    const [excepcion] = await actions.fetchExceptions();
    expect(excepcion!.horaInicio).toBeUndefined();
    expect(excepcion!.horaFin).toBeUndefined();
  });

  it("al crear manda null cuando la excepción no tiene franja horaria", async () => {
    api.postException.mockResolvedValue({
      id: "e3",
      titulo: "Feriado",
      fecha: "2026-08-10",
      horaInicio: null,
      horaFin: null,
      tipo: "feriado",
    } as never);

    await actions.createException({
      espacioId: 1,
      titulo: "Feriado",
      fecha: "2026-08-10",
      tipo: "feriado",
    });

    expect(api.postException).toHaveBeenCalledWith(
      {
        espacioId: 1,
        titulo: "Feriado",
        fecha: "2026-08-10",
        tipo: "feriado",
        horaInicio: null,
        horaFin: null,
      },
      TOKEN,
    );
  });

  it("al crear completa los segundos de la franja horaria", async () => {
    api.postException.mockResolvedValue({
      id: "e4",
      titulo: "Mantenimiento",
      fecha: "2026-08-11",
      horaInicio: "10:00:00",
      horaFin: "12:00:00",
      tipo: "mantenimiento",
    } as never);

    await actions.createException({
      espacioId: 3,
      titulo: "Mantenimiento",
      fecha: "2026-08-11",
      horaInicio: "10:00",
      horaFin: "12:00",
      tipo: "mantenimiento",
    });

    expect(api.postException).toHaveBeenCalledWith(
      expect.objectContaining({ horaInicio: "10:00:00", horaFin: "12:00:00" }),
      TOKEN,
    );
  });

  it("updateException usa el mismo mapeo de petición que createException", async () => {
    api.putException.mockResolvedValue({
      id: "e5",
      titulo: "Feriado movido",
      fecha: "2026-08-12",
      horaInicio: null,
      horaFin: null,
      tipo: "feriado",
    } as never);

    const actualizada = await actions.updateException("e5", {
      espacioId: 3,
      titulo: "Feriado movido",
      fecha: "2026-08-12",
      tipo: "feriado",
    });

    expect(api.putException).toHaveBeenCalledWith(
      "e5",
      expect.objectContaining({ titulo: "Feriado movido", horaInicio: null }),
      TOKEN,
    );
    expect(actualizada.id).toBe("e5");
  });

  it("deleteException delega en el transporte con el token de sesión", async () => {
    await actions.deleteException("e9");
    expect(api.deleteException).toHaveBeenCalledWith("e9", TOKEN);
  });
});

describe("bloqueos manuales", () => {
  it("crea el rango y devuelve un bloque por hora", async () => {
    api.postBlock.mockResolvedValue([
      { id: "b1", espacioId: 1, espacioNombre: "Cancha", fecha: "2026-03-10", hora: 9, estado: "blocked", notas: null },
      { id: "b2", espacioId: 1, espacioNombre: "Cancha", fecha: "2026-03-10", hora: 10, estado: "blocked", notas: null },
    ] as never);

    const bloques = await actions.createBlock({
      espacioId: 1,
      fecha: "2026-03-10",
      hourStart: 9,
      hourEnd: 11,
      estado: "blocked",
    });

    expect(api.postBlock).toHaveBeenCalledWith(
      { espacioId: 1, fecha: "2026-03-10", hourStart: 9, hourEnd: 11, estado: "blocked", notas: null },
      TOKEN,
    );
    expect(bloques).toHaveLength(2);
    expect(bloques[0]!.status).toBe("blocked");
  });

  it("envía las notas cuando el anfitrión las escribe", async () => {
    api.postBlock.mockResolvedValue([] as never);

    await actions.createBlock({
      espacioId: 1,
      fecha: "2026-03-10",
      hourStart: 9,
      hourEnd: 10,
      estado: "maintenance",
      notas: "Cambio de césped",
    });

    expect(api.postBlock).toHaveBeenCalledWith(
      expect.objectContaining({ notas: "Cambio de césped", estado: "maintenance" }),
      TOKEN,
    );
  });

  /**
   * Un slot sin id no se puede liberar. Antes de tocar la red se corta con un
   * mensaje accionable, en vez de dejar que el backend responda 404.
   */
  it("rechaza liberar un horario sin identificador, sin llamar al backend", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(actions.deleteBlock("")).rejects.toThrow(
      "Este horario no tiene un identificador válido para liberar.",
    );
    expect(api.deleteBlock).not.toHaveBeenCalled();
  });

  it("libera un bloqueo con id válido", async () => {
    await actions.deleteBlock("b1");
    expect(api.deleteBlock).toHaveBeenCalledWith("b1", TOKEN);
  });
});
