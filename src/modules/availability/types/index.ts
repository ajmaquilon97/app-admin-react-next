export type Status = "available" | "reserved" | "blocked" | "maintenance" | "closed";

export type ViewMode = "day" | "week" | "month";

export type Espacio = {
  id: number;
  nombre: string;
  modalidadReserva: string | null;
  tipoEspacioNombre: string | null;
  maxCapacidad: number;
  validarAforo: boolean;
};

export type Block = {
  id: string;
  espacioId: number;
  espacioNombre: string;
  date: string; // YYYY-MM-DD
  hour: number; // 8..18
  status: Status;
  clientName?: string;
  notes?: string;
};

export type Schedule = {
  apertura: string;    // "HH:mm"
  cierre: string;      // "HH:mm"
  diasActivos: number[]; // 0=Lun..6=Dom (frontend convention)
  espacioId?: number;  // present when loaded from backend
};

export type AvailabilityException = {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string; // "HH:mm"
  horaFin?: string;    // "HH:mm"
  tipo: "feriado" | "mantenimiento" | "cierre";
};

export type Statistics = {
  horasDisponibles: number;
  horasReservadas: number;
  horasBloqueadas: number;
  ocupacion: number;
};

export type ToastMessage = {
  id: string;
  type: "success" | "error";
  message: string;
};

export type AforoDiaResumen = {
  fecha: string; // YYYY-MM-DD
  capacidadTotal: number;
  vendida: number;
  disponible: number;
};

export type AforoTicket = {
  id: string;
  clienteNombre: string;
  cantidad: number;
  hora: string; // "HH:mm"
};

export type AforoDiaDetalle = AforoDiaResumen & {
  tickets: AforoTicket[];
};
