import {
  formatISODate,
  getWeekStart,
  getWeekDates,
  isToday,
} from "@/modules/availability/utils/date";
import {
  STATUS_LABELS,
  getStatusClasses,
  getStatusDotColor,
  EXCEPTION_TYPE_COLOR,
  availabilityKeys,
} from "@/modules/availability/constants";
// `Status` es interno del módulo: el barril solo expone su API pública, y esta
// prueba verifica precisamente la tabla de estados de la agenda.
import type { Status } from "@/modules/availability/types";

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
