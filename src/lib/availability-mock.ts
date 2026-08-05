import type {
  Block,
  Schedule,
  AvailabilityException,
  Statistics,
  Status,
  Espacio,
} from "@/components/availability/types";

export const MOCK_SPACES: Espacio[] = [
  { id: 1, nombre: "Cancha Sintética 1", modalidadReserva: "franja_exclusiva", tipoEspacioNombre: "Cancha", maxCapacidad: 20, validarAforo: false },
  { id: 2, nombre: "Cancha Múltiple", modalidadReserva: "franja_exclusiva", tipoEspacioNombre: "Cancha", maxCapacidad: 20, validarAforo: false },
  { id: 3, nombre: "Piscina Olímpica", modalidadReserva: "cupo_compartido", tipoEspacioNombre: "Piscina", maxCapacidad: 80, validarAforo: true },
  { id: 4, nombre: "Salón de Eventos VIP", modalidadReserva: "franja_exclusiva", tipoEspacioNombre: "Salón", maxCapacidad: 150, validarAforo: false },
  { id: 5, nombre: "Área de Camping", modalidadReserva: null, tipoEspacioNombre: "Camping", maxCapacidad: 30, validarAforo: false },
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8..18
const CLIENTS = ["Carlos Mendoza", "Ana Torres", "Equipo Tech", "Familia Ruiz", "Diego Paredes"];

function simpleHash(s: string): number {
  let h = 1;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isToday(date: Date): boolean {
  return formatISODate(date) === formatISODate(new Date());
}

function generateBlocksForWeek(weekStart: Date): Block[] {
  const rand = seededRandom(simpleHash(formatISODate(weekStart)));
  const blocks: Block[] = [];
  const weekDates = getWeekDates(weekStart);

  weekDates.forEach((date) => {
    const dateStr = formatISODate(date);
    MOCK_SPACES.forEach((space) => {
      HOURS.forEach((hour) => {
        const r = rand();
        let status: Status = "available";
        let clientName: string | undefined;
        let notes: string | undefined;

        if (r > 0.85) {
          status = "reserved";
          clientName = CLIENTS[Math.floor(rand() * CLIENTS.length)];
        } else if (r > 0.76) {
          status = "blocked";
          notes = "Reserva pendiente de pago";
        } else if (r > 0.71) {
          status = "maintenance";
          notes = ["Limpieza de filtros", "Revisión técnica", "Mantenimiento preventivo"][
            Math.floor(rand() * 3)
          ];
        } else if (r > 0.68) {
          status = "closed";
        }

        blocks.push({
          id: `${dateStr}-${space.id}-${hour}`,
          espacioId: space.id,
          espacioNombre: space.nombre,
          date: dateStr,
          hour,
          status,
          clientName,
          notes,
        });
      });
    });
  });

  return blocks;
}

function calcStats(blocks: Block[]): Statistics {
  const avail = blocks.filter((b) => b.status === "available").length;
  const reserved = blocks.filter((b) => b.status === "reserved").length;
  const blocked = blocks.filter((b) => b.status === "blocked" || b.status === "maintenance").length;
  const total = avail + reserved + blocked;
  return {
    horasDisponibles: avail,
    horasReservadas: reserved,
    horasBloqueadas: blocked,
    ocupacion: total > 0 ? Math.round((reserved / total) * 100) : 0,
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getAvailability(weekStart: Date): Promise<Block[]> {
  await delay(600);
  return generateBlocksForWeek(weekStart);
}

export async function getAvailabilityStatistics(weekStart: Date): Promise<Statistics> {
  await delay(400);
  const blocks = generateBlocksForWeek(weekStart);
  return calcStats(blocks);
}

export async function postAvailabilityBlock(data: {
  espacioId: number;
  date: string;
  hourStart: number;
  hourEnd: number;
  notes?: string;
}): Promise<Block> {
  await delay(500);
  return {
    id: `${data.date}-${data.espacioId}-${data.hourStart}-new`,
    espacioId: data.espacioId,
    espacioNombre: MOCK_SPACES.find((s) => s.id === data.espacioId)?.nombre ?? "",
    date: data.date,
    hour: data.hourStart,
    status: "blocked",
    notes: data.notes,
  };
}

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  await delay(400);
  void id;
}

const DEFAULT_SCHEDULE: Schedule = {
  apertura: "08:00",
  cierre: "22:00",
  diasActivos: [0, 1, 2, 3, 4, 5, 6],
};

export async function getAvailabilitySchedule(): Promise<Schedule> {
  await delay(300);
  return { ...DEFAULT_SCHEDULE };
}

export async function putAvailabilitySchedule(schedule: Schedule): Promise<void> {
  await delay(500);
  void schedule;
}

const INITIAL_EXCEPTIONS: AvailabilityException[] = [
  {
    id: "exc-1",
    titulo: "Feriado Nacional (Navidad)",
    fecha: "2026-12-25",
    tipo: "feriado",
  },
  {
    id: "exc-2",
    titulo: "Mantenimiento de Piscina",
    fecha: "2026-08-15",
    horaInicio: "08:00",
    horaFin: "14:00",
    tipo: "mantenimiento",
  },
];

export async function getAvailabilityExceptions(): Promise<AvailabilityException[]> {
  await delay(300);
  return [...INITIAL_EXCEPTIONS];
}

export async function postAvailabilityException(
  data: Omit<AvailabilityException, "id">,
): Promise<AvailabilityException> {
  await delay(500);
  return { ...data, id: `exc-${Date.now()}` };
}

export async function putAvailabilityException(
  id: string,
  data: Omit<AvailabilityException, "id">,
): Promise<AvailabilityException> {
  await delay(500);
  return { ...data, id };
}

export async function deleteAvailabilityException(id: string): Promise<void> {
  await delay(400);
  void id;
}
