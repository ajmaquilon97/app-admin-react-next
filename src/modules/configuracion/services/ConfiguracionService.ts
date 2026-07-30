// Por ahora conectado a datos mock (src/lib/configuracion-mock.ts). Cuando el backend
// exponga endpoints de perfil/negocio/configuración de reservas del anfitrión, este
// archivo pasa a delegar en Server Actions (src/actions/configuracion.ts), igual que
// hizo BookingService — la interfaz pública no debería cambiar.
import type {
  EspacioBookingConfig,
  EspacioOption,
  NegocioInfo,
  PerfilAnfitrion,
  ReservationConfirmationMode,
} from "../types";
import * as configuracionMock from "@/lib/configuracion-mock";

export const ConfiguracionService = {
  async getPerfil(): Promise<PerfilAnfitrion> {
    return configuracionMock.getPerfil();
  },

  async updatePerfil(input: PerfilAnfitrion): Promise<PerfilAnfitrion> {
    return configuracionMock.updatePerfil(input);
  },

  async getNegocio(): Promise<NegocioInfo> {
    return configuracionMock.getNegocio();
  },

  async updateNegocio(input: NegocioInfo): Promise<NegocioInfo> {
    return configuracionMock.updateNegocio(input);
  },

  async getBookingConfigs(espacios: EspacioOption[]): Promise<EspacioBookingConfig[]> {
    return configuracionMock.getBookingConfigs(espacios);
  },

  async updateBookingConfig(
    espacioId: string,
    espacioNombre: string,
    modo: ReservationConfirmationMode,
  ): Promise<EspacioBookingConfig> {
    return configuracionMock.updateBookingConfig(espacioId, espacioNombre, modo);
  },
};
