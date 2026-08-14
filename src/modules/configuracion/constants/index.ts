import type { ReservationConfirmationMode } from "../types";

export const configuracionKeys = {
  perfil: ["configuracion", "perfil"] as const,
  negocio: ["configuracion", "negocio"] as const,
  bookingConfigs: ["configuracion", "reservas"] as const,
};

export const CONFIRMATION_MODE_OPTIONS: {
  value: ReservationConfirmationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "inmediata",
    label: "Confirmación inmediata",
    description:
      "El usuario paga al reservar y la reserva se confirma automáticamente, sin intervención tuya.",
  },
  {
    value: "pago_confirmacion_manual",
    label: "Pago inmediato, confirmación manual",
    description:
      "El usuario paga al reservar, pero la reserva queda pendiente hasta que tú la confirmes.",
  },
  {
    value: "solicitud_aprobacion",
    label: "Solicitud con aprobación previa",
    description:
      "La reserva queda como \"solicitada\"; debes aprobarla antes de que se habilite el pago y se confirme.",
  },
];
