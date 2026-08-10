import { z } from "zod";

export const modalidadConfigSchema = z.object({
  activa: z.boolean(),
  precio: z.number().positive("Debe ser mayor a 0").nullable(),
});

export const tarifaDiaSchema = z.object({
  dia: z.number().min(0).max(6),
  activo: z.boolean(),
  precio: z.number().positive("Debe ser mayor a 0").nullable(),
});

export const fechaEspecialSchema = z.object({
  fecha: z.string().min(1, "Selecciona una fecha"),
  descripcion: z.string().min(1, "Agrega una descripción"),
  precio: z.number().positive("Debe ser mayor a 0"),
  modalidad: z.enum(["hora", "jornada", "evento", "entrada"]),
});

export const promocionSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.enum(["porcentaje", "monto_fijo"]),
  valor: z.number().positive("Debe ser mayor a 0"),
  activa: z.boolean(),
  condicion: z.string().min(1, "Condición requerida"),
});

export const espacioPricingSchema = z.object({
  modalidades: z.record(z.enum(["hora", "jornada", "evento", "entrada"]), modalidadConfigSchema),
  tarifasPorDia: z.array(tarifaDiaSchema),
});

export type FechaEspecialForm = z.infer<typeof fechaEspecialSchema>;
export type PromocionForm = z.infer<typeof promocionSchema>;
export type EspacioPricingForm = z.infer<typeof espacioPricingSchema>;
