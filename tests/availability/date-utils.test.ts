import {
  formatISODate,
  getWeekStart,
  getWeekDates,
  isToday,
} from "@/modules/availability/utils/date";
import {
  getGridHours,
  openingHour,
  closingHour,
} from "@/modules/availability/utils/hours";
import {
  STATUS_LABELS,
  getStatusClasses,
  getStatusDotColor,
  EXCEPTION_TYPE_COLOR,
  availabilityKeys,
} from "@/modules/availability/constants";
// `Status` es interno del módulo: el barril solo expone su API pública, y esta
// prueba verifica precisamente la tabla de estados de la agenda.
import type { Status, Schedule, Block } from "@/modules/availability/types";

/**
 * Helpers de fecha de la agenda semanal.
 *
 * `getWeekStart` implementa la semana que empieza en lunes (convención local),
 * distinta de la de JavaScript, que arranca en domingo. El caso del domingo es
 * el que suele romperse, así que se prueba cada día de la semana.
 */
describe("formatISODate", () => {
  it("recorta la marca ISO a YYYY-MM-DD", () => {
    expect(formatISODate(new Date(Date.UTC(2026, 2, 10, 15, 30)))).toBe("2026-03-10");
  });
});

describe("getWeekStart", () => {
  it.each([
    ["lunes", "2026-03-09"],
    ["martes", "2026-03-10"],
    ["miércoles", "2026-03-11"],
    ["jueves", "2026-03-12"],
    ["viernes", "2026-03-13"],
    ["sábado", "2026-03-14"],
    ["domingo", "2026-03-15"],
  ])("desde un %s devuelve el lunes 2026-03-09", (_dia, fecha) => {
    const inicio = getWeekStart(new Date(`${fecha}T12:00:00`));

    expect(inicio.getFullYear()).toBe(2026);
    expect(inicio.getMonth()).toBe(2);
    expect(inicio.getDate()).toBe(9);
  });

  it("normaliza la hora a medianoche", () => {
    const inicio = getWeekStart(new Date("2026-03-11T23:45:12"));
    expect([inicio.getHours(), inicio.getMinutes(), inicio.getSeconds(), inicio.getMilliseconds()])
      .toEqual([0, 0, 0, 0]);
  });

  it("no muta la fecha recibida", () => {
    const original = new Date("2026-03-11T23:45:12");
    const copia = new Date(original);
    getWeekStart(original);
    expect(original.getTime()).toBe(copia.getTime());
  });

  it("cruza el cambio de mes hacia atrás", () => {
    const inicio = getWeekStart(new Date("2026-04-01T10:00:00")); // miércoles
    expect(inicio.getMonth()).toBe(2); // marzo
    expect(inicio.getDate()).toBe(30);
  });
});

describe("getWeekDates", () => {
  it("devuelve los 7 días consecutivos desde el inicio de semana", () => {
    const dias = getWeekDates(getWeekStart(new Date("2026-03-11T10:00:00")));

    expect(dias).toHaveLength(7);
    expect(dias.map((d) => d.getDate())).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });

  it("no muta el día de inicio al desplazarse", () => {
    const inicio = getWeekStart(new Date("2026-03-11T10:00:00"));
    const antes = inicio.getTime();
    getWeekDates(inicio);
    expect(inicio.getTime()).toBe(antes);
  });
});

describe("isToday", () => {
  it("reconoce la fecha actual", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("descarta otra fecha", () => {
    expect(isToday(new Date("1999-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("presentación de estados de la agenda", () => {
  const estados: Status[] = ["available", "reserved", "blocked", "maintenance", "closed"];

  it("cada estado tiene etiqueta en español", () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...estados].sort());
    expect(STATUS_LABELS.reserved).toBe("Reservado");
  });

  it.each(estados)("cada estado (%s) tiene clases y color de punto propios", (estado) => {
    expect(getStatusClasses(estado)).toBeTruthy();
    expect(getStatusDotColor(estado)).toBeTruthy();
  });

  it("solo los estados accionables son clicables", () => {
    expect(getStatusClasses("closed")).toContain("cursor-default");
    expect(getStatusClasses("available")).toContain("cursor-pointer");
    expect(getStatusClasses("reserved")).toContain("cursor-pointer");
  });

  it("los tres tipos de excepción tienen color asignado", () => {
    expect(Object.keys(EXCEPTION_TYPE_COLOR).sort()).toEqual(["cierre", "feriado", "mantenimiento"]);
  });
});

describe("availabilityKeys", () => {
  /**
   * `useBookingActions` invalida `["availability"]` tras confirmar o cancelar una
   * reserva. Para que esa invalidación alcance a toda la agenda, cada clave del
   * módulo debe empezar por ese mismo prefijo.
   */
  it("todas las claves comparten el prefijo que se invalida desde reservas", () => {
    const claves = [
      availabilityKeys.all,
      availabilityKeys.serverNow,
      availabilityKeys.blocks(1, "2026-03-09", "2026-03-15"),
      availabilityKeys.statistics(1, "2026-03-09", "2026-03-15"),
      availabilityKeys.schedule(1),
      availabilityKeys.exceptions(1),
      availabilityKeys.aforoSemana(1, "2026-03-09", "2026-03-15"),
      availabilityKeys.aforoDia(1, "2026-03-10"),
    ];

    for (const clave of claves) expect(clave[0]).toBe("availability");
  });

  it("distingue consultas por espacio y por rango de fechas", () => {
    expect(availabilityKeys.blocks(1, "a", "b")).not.toEqual(availabilityKeys.blocks(2, "a", "b"));
    expect(availabilityKeys.blocks(1, "a", "b")).not.toEqual(availabilityKeys.blocks(1, "a", "c"));
  });
});

/**
 * Rango horario de la grilla.
 *
 * El caso que motivó estos helpers: la grilla estaba fijada a 8:00–18:00, así
 * que un espacio con horario más largo —el propio horario por defecto cierra a
 * las 22:00— tenía franjas que no se dibujaban en ninguna celda.
 */
describe("getGridHours", () => {
  const horario = (apertura: string, cierre: string): Schedule => ({
    apertura,
    cierre,
    diasActivos: [0, 1, 2, 3, 4, 5, 6],
  });

  const bloque = (hour: number, espacioId = 1): Block => ({
    id: `b-${hour}`,
    espacioId,
    espacioNombre: "Cancha Norte",
    date: "2026-03-10",
    hour,
    status: "reserved",
  });

  it("cae al rango de respaldo 8:00–18:00 sin horario legible", () => {
    expect(getGridHours({})).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    expect(getGridHours({ schedule: horario("no-es-una-hora", "tampoco") })).toHaveLength(11);
  });

  it("cubre el horario del espacio, con el cierre como límite exclusivo", () => {
    const horas = getGridHours({ schedule: horario("06:00", "22:00") });

    expect(horas[0]).toBe(6);
    expect(horas.at(-1)).toBe(21); // la franja de las 22 ya está cerrada
  });

  it("incluye la franja en curso cuando el cierre cae a mitad de hora", () => {
    expect(getGridHours({ schedule: horario("08:00", "22:30") }).at(-1)).toBe(22);
  });

  it("trata 00:00 y 24:00 como cierre a medianoche", () => {
    for (const cierre of ["00:00", "24:00"]) {
      expect(getGridHours({ schedule: horario("00:00", cierre) })).toHaveLength(24);
    }
  });

  it("dibuja el día completo si el horario cruza la medianoche", () => {
    const horas = getGridHours({ schedule: horario("20:00", "02:00") });

    expect(horas[0]).toBe(0);
    expect(horas.at(-1)).toBe(23);
  });

  /** Si un bloque quedara fuera del rango, desaparecería de la pantalla. */
  it("amplía el rango para que ningún bloque quede fuera", () => {
    const horas = getGridHours({
      schedule: horario("10:00", "18:00"),
      blocks: [bloque(6), bloque(23)],
      espacioId: 1,
    });

    expect(horas[0]).toBe(6);
    expect(horas.at(-1)).toBe(23);
  });

  it("no se amplía por bloques de otro espacio ni por horas imposibles", () => {
    const horas = getGridHours({
      schedule: horario("10:00", "18:00"),
      blocks: [bloque(23, 99), bloque(30), bloque(-1)],
      espacioId: 1,
    });

    expect(horas).toEqual([10, 11, 12, 13, 14, 15, 16, 17]);
  });
});

describe("closingHour / openingHour", () => {
  const base = { apertura: "08:00", cierre: "22:00", diasActivos: [] };

  it("devuelve null si la hora no es legible", () => {
    expect(openingHour({ ...base, apertura: "" })).toBeNull();
    expect(closingHour({ ...base, cierre: "25:99" })).toBeNull();
    expect(openingHour(null)).toBeNull();
  });

  it("trunca la apertura a la franja que la contiene", () => {
    expect(openingHour({ ...base, apertura: "08:45" })).toBe(8);
  });
});
