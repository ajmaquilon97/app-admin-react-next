export type TicketEstado = "abierto" | "en_revision" | "aprobado" | "rechazado";

export interface TicketSoporte {
  id: string;
  reservaId: number;
  reservaCodigo: string;
  clienteNombre: string;
  descripcion: string;
  estado: TicketEstado;
  estadoLabel: string;
  resolucionNotas: string | null;
  fechaCreacion: string;
  fechaResolucion: string | null;
}

export interface TicketFilters {
  estado?: TicketEstado | "";
  page?: number;
  pageSize?: number;
}

export type { PagedResponse } from "@/lib/domain";
