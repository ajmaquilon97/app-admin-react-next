export type Modalidad = "hora" | "jornada" | "evento" | "entrada";

export interface ModalidadConfig {
  activa: boolean;
  precio: number | null;
}

export interface TarifaDia {
  dia: number; // 0=Lunes..6=Domingo
  activo: boolean;
  precio: number | null;
}

export interface FechaEspecial {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  descripcion: string;
  precio: number;
  modalidad: Modalidad;
}

export interface Promocion {
  id: string;
  nombre: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  activa: boolean;
  condicion: string;
}

export interface EspacioPricing {
  espacioId: number;
  modalidades: Record<Modalidad, ModalidadConfig>;
  tarifasPorDia: TarifaDia[];
  fechasEspeciales: FechaEspecial[];
  promociones: Promocion[];
}

export interface EspacioOption {
  id: number;
  titulo: string;
  tipoEspacioNombre: string | null;
  modalidadReserva: string | null;
}
