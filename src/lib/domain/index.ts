/**
 * Capa de dominio compartida — vocabulario de negocio que no pertenece a un solo módulo.
 *
 * Regla: aquí solo entra lo que consumen **dos o más** dominios. Lo que usa un único
 * módulo vive en `modules/<feature>/types`.
 */
export { getArchetype, isCupoCompartido, type EspacioArchetype } from "./espacio-archetype";
export type { PagedResponse } from "./pagination";
export type { EspacioOption } from "./espacio";
