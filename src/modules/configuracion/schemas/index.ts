import { z } from "zod";

export const perfilSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  apellido: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Correo inválido"),
  telefono: z.string().min(7, "Teléfono inválido"),
  fotoPerfilUrl: z.string(),
  documentoIdentidadUrl: z.string(),
  numeroCedula: z.string().min(1, "Cédula requerida"),
  fechaNacimiento: z.string().min(1, "Fecha de nacimiento requerida"),
  provinciaId: z.number().int().positive("Provincia requerida"),
  ciudadId: z.number().int().positive("Ciudad requerida"),
});

export const negocioSchema = z.object({
  nombreNegocio: z.string().min(1, "Nombre del negocio requerido"),
  ruc: z.string().length(13, "El RUC debe tener 13 dígitos"),
  razonSocial: z.string().min(1, "Razón social requerida"),
  categoria: z.string().min(1, "Categoría requerida"),
  direccion: z.string().min(1, "Dirección requerida"),
  ciudad: z.string().min(1, "Ciudad requerida"),
  provincia: z.string().min(1, "Provincia requerida"),
  telefonoNegocio: z.string().min(7, "Teléfono inválido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  logoUrl: z.string(),
});

export type PerfilForm = z.infer<typeof perfilSchema>;
export type NegocioForm = z.infer<typeof negocioSchema>;
