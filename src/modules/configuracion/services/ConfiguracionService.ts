// Perfil, Negocio y la configuración de Reservas por espacio ya están conectados al
// backend real vía Server Actions (src/actions/configuracion.ts, src/actions/negocio.ts,
// src/actions/reservas-config.ts) — la interfaz pública no cambió.
import type {
  EspacioBookingConfig,
  EspacioOption,
  NegocioInfo,
  PerfilAnfitrion,
  ReservationConfirmationMode,
} from "../types";
import * as configuracionActions from "@/actions/configuracion";
import * as negocioActions from "@/actions/negocio";
import * as reservasConfigActions from "@/actions/reservas-config";

export const ConfiguracionService = {
  async getPerfil(): Promise<PerfilAnfitrion> {
    return configuracionActions.getPerfil();
  },

  async updatePerfil(input: PerfilAnfitrion): Promise<PerfilAnfitrion> {
    return configuracionActions.updatePerfil(input);
  },

  async getNegocio(): Promise<NegocioInfo> {
    return negocioActions.getNegocio();
  },

  async updateNegocio(input: NegocioInfo): Promise<NegocioInfo> {
    return negocioActions.updateNegocio(input);
  },

  async getBookingConfigs(espacios: EspacioOption[]): Promise<EspacioBookingConfig[]> {
    return reservasConfigActions.getBookingConfigs(espacios);
  },

  async updateBookingConfig(
    espacioId: string,
    espacioNombre: string,
    modo: ReservationConfirmationMode,
  ): Promise<EspacioBookingConfig> {
    return reservasConfigActions.updateBookingConfig(espacioId, espacioNombre, modo);
  },
};
