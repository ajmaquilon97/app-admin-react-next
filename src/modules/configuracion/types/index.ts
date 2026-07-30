// ── Enums / Union Types ────────────────────────────────────────────────────────

export type ReservationConfirmationMode =
  | "inmediata" // paga y se confirma automáticamente
  | "pago_confirmacion_manual" // paga de inmediato, el anfitrión confirma después
  | "solicitud_aprobacion"; // queda "solicitada", el anfitrión aprueba antes de habilitar el pago

// ── Core Models ────────────────────────────────────────────────────────────────

export interface PerfilAnfitrion {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fotoPerfilUrl: string;
  documentoIdentidadUrl: string;
}

export interface NegocioInfo {
  nombreNegocio: string;
  ruc: string;
  categoria: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  telefonoNegocio: string;
  descripcion: string;
  logoUrl: string;
}

export interface EspacioBookingConfig {
  espacioId: string;
  espacioNombre: string;
  modo: ReservationConfirmationMode;
}

// ── Space Option (lista real de espacios del anfitrión) ────────────────────────

export interface EspacioOption {
  id: string;
  nombre: string;
}
