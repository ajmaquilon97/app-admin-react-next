import type {
  EspacioBookingConfig,
  EspacioOption,
  NegocioInfo,
  PerfilAnfitrion,
  ReservationConfirmationMode,
} from "@/modules/configuracion/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let perfil: PerfilAnfitrion = {
  nombre: "María",
  apellido: "Salazar",
  email: "maria.salazar@agora.app",
  telefono: "0991234567",
  fotoPerfilUrl: "",
  documentoIdentidadUrl: "",
};

let negocio: NegocioInfo = {
  nombreNegocio: "Agora Espacios",
  ruc: "1712345678001",
  categoria: "Canchas deportivas",
  direccion: "Av. de los Shyris N34-155",
  ciudad: "Quito",
  provincia: "Pichincha",
  telefonoNegocio: "0223456789",
  descripcion: "Alquiler de espacios deportivos y de eventos.",
  logoUrl: "",
};

const bookingConfigs = new Map<string, EspacioBookingConfig>();

export async function getPerfil(): Promise<PerfilAnfitrion> {
  await delay(300);
  return { ...perfil };
}

export async function updatePerfil(input: PerfilAnfitrion): Promise<PerfilAnfitrion> {
  await delay(400);
  perfil = { ...input };
  return { ...perfil };
}

export async function getNegocio(): Promise<NegocioInfo> {
  await delay(300);
  return { ...negocio };
}

export async function updateNegocio(input: NegocioInfo): Promise<NegocioInfo> {
  await delay(400);
  negocio = { ...input };
  return { ...negocio };
}

export async function getBookingConfigs(espacios: EspacioOption[]): Promise<EspacioBookingConfig[]> {
  await delay(300);
  return espacios.map((e) => {
    const existing = bookingConfigs.get(e.id);
    if (existing) return { ...existing, espacioNombre: e.nombre };
    const created: EspacioBookingConfig = { espacioId: e.id, espacioNombre: e.nombre, modo: "inmediata" };
    bookingConfigs.set(e.id, created);
    return { ...created };
  });
}

export async function updateBookingConfig(
  espacioId: string,
  espacioNombre: string,
  modo: ReservationConfirmationMode,
): Promise<EspacioBookingConfig> {
  await delay(350);
  const updated: EspacioBookingConfig = { espacioId, espacioNombre, modo };
  bookingConfigs.set(espacioId, updated);
  return { ...updated };
}
