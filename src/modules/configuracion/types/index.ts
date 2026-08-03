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
  numeroCedula: string;
  fechaNacimiento: string;
  /** FK a GET /api/catalogos/ubicaciones. 0 = sin seleccionar. */
  provinciaId: number;
  ciudadId: number;
}

/** Datos fiscales/comerciales del negocio del anfitrión — separados del perfil personal. */
export interface NegocioInfo {
  nombreNegocio: string;
  /** RUC (13 dígitos) — siempre tipoIdentificacion "04" ante el SRI. */
  ruc: string;
  razonSocial: string;
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
