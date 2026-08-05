import { getWeekDates, formatISODate } from "./availability-mock";

/**
 * Datos de aforo/venta diaria simulados en el frontend — el backend todavía
 * no tiene un endpoint de venta de entradas por día para espacios de cupo
 * compartido (piscinas). Ver spec de backend pendiente. Los datos son
 * deterministas (seed por espacioId+fecha) para que la UI sea estable entre
 * renders, y se reemplazan por el fetch real apenas exista el endpoint.
 */

const CLIENTS = ["Carlos Mendoza", "Ana Torres", "Familia Ruiz", "Diego Paredes", "Equipo Tech", "Valeria Sánchez"];

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

export type TicketVenta = {
  id: string;
  clienteNombre: string;
  cantidad: number;
  hora: string; // "HH:mm"
};

export type AforoDia = {
  fecha: string; // YYYY-MM-DD
  capacidadTotal: number;
  vendida: number;
  disponible: number;
  tickets: TicketVenta[];
};

export function getAforoSemana(espacioId: number, maxCapacidad: number, weekStart: Date): AforoDia[] {
  const capacidadTotal = Math.max(maxCapacidad, 1);

  return getWeekDates(weekStart).map((date) => {
    const fecha = formatISODate(date);
    const rand = seededRandom(simpleHash(`${espacioId}-${fecha}`));
    const tickets: TicketVenta[] = [];
    let vendida = 0;
    const numVentas = Math.floor(rand() * 6); // 0..5 ventas por día

    for (let i = 0; i < numVentas && vendida < capacidadTotal; i++) {
      const cantidad = Math.min(1 + Math.floor(rand() * 4), capacidadTotal - vendida);
      if (cantidad <= 0) break;
      vendida += cantidad;
      const hora = `${String(8 + Math.floor(rand() * 12)).padStart(2, "0")}:${rand() > 0.5 ? "30" : "00"}`;
      tickets.push({
        id: `${fecha}-${espacioId}-${i}`,
        clienteNombre: CLIENTS[Math.floor(rand() * CLIENTS.length)]!,
        cantidad,
        hora,
      });
    }

    return {
      fecha,
      capacidadTotal,
      vendida,
      disponible: capacidadTotal - vendida,
      tickets,
    };
  });
}
