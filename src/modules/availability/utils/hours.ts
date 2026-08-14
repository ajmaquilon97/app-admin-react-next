/**
 * Rango horario que dibuja la grilla de la agenda.
 *
 * Antes eran once franjas fijas (8:00–18:00) escritas a mano en la grilla y en
 * el modal de bloqueo. Con eso, un espacio abierto más allá de las 18:00 —el
 * horario por defecto ya llega a las 22:00— tenía reservas y bloqueos que no se
 * dibujaban en ninguna celda: existían en el backend pero no en pantalla.
 *
 * El rango se deriva ahora del horario general del espacio, y los bloques
 * mandan sobre él: ninguno puede quedar fuera de la grilla.
 */
import type { Block, Schedule } from "../types";

/** Rango de respaldo cuando no hay horario legible. `end` es exclusivo. */
export const DEFAULT_GRID_RANGE = { start: 8, end: 19 } as const;

const HHMM = /^(\d{1,2}):(\d{2})/;

function parseHHmm(value: string | undefined): { hour: number; minute: number } | null {
  const match = value?.match(HHMM);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 24 || minute > 59) return null;
  return { hour, minute };
}

/** Primera franja que se dibuja: la hora de apertura, truncada. */
export function openingHour(schedule: Schedule | null | undefined): number | null {
  const t = parseHHmm(schedule?.apertura);
  return t ? Math.min(t.hour, 23) : null;
}

/**
 * Primera franja que ya **no** se dibuja (límite exclusivo):
 * `"22:00"` → 22 · `"22:30"` → 23, porque la franja de las 22 sigue abierta ·
 * `"00:00"` y `"24:00"` → 24, que es como el backend expresa el cierre a medianoche.
 */
export function closingHour(schedule: Schedule | null | undefined): number | null {
  const t = parseHHmm(schedule?.cierre);
  if (!t) return null;
  if (t.hour === 0 || t.hour === 24) return 24;
  return Math.min(t.minute > 0 ? t.hour + 1 : t.hour, 24);
}

/**
 * Franjas horarias a dibujar, en orden.
 *
 * El filtro de estado no interviene a propósito: la grilla no debe cambiar de
 * alto al filtrar por «reservado» o «bloqueado».
 */
export function getGridHours({
  schedule,
  blocks = [],
  espacioId,
}: {
  schedule?: Schedule | null;
  blocks?: Block[];
  espacioId?: number;
}): number[] {
  const opening = openingHour(schedule);
  const closing = closingHour(schedule);

  // Anotados: `DEFAULT_GRID_RANGE` es `as const`, así que sin el tipo explícito
  // se infieren los literales 8 y 19 y no admiten reasignación.
  let start: number = DEFAULT_GRID_RANGE.start;
  let end: number = DEFAULT_GRID_RANGE.end;

  if (opening !== null && closing !== null) {
    if (closing <= opening) {
      // El espacio cruza la medianoche (p. ej. 20:00–02:00). No hay un tramo
      // contiguo que lo represente en una grilla de un día, así que se dibuja
      // el día completo.
      start = 0;
      end = 24;
    } else {
      start = opening;
      end = closing;
    }
  }

  // Un bloque fuera del horario —una reserva heredada, un bloqueo puesto antes
  // de recortar el horario— no puede quedar invisible: el dato manda.
  for (const block of blocks) {
    if (espacioId !== undefined && block.espacioId !== espacioId) continue;
    if (!Number.isInteger(block.hour) || block.hour < 0 || block.hour > 23) continue;
    start = Math.min(start, block.hour);
    end = Math.max(end, block.hour + 1);
  }

  return Array.from({ length: end - start }, (_, i) => start + i);
}
