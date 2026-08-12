"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionTokens } from "@/lib/auth/session";
import * as spacesApi from "../api/spaces";

export type CreateEspacioState = { error?: string } | undefined;
export type UpdateEspacioState = { error?: string } | undefined;
export type ActivarEspacioState = { error?: string } | undefined;
export type InactivarEspacioState = { error?: string } | undefined;

export async function createEspacio(
  _state: CreateEspacioState,
  formData: FormData,
): Promise<CreateEspacioState> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");

  const data: spacesApi.EspacioRequest = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    propietarioId: formData.get("propietarioId") as string,
    tipoEspacioId: Number(formData.get("tipoEspacioId")),
    provinciaId: formData.get("provinciaId") ? Number(formData.get("provinciaId")) : undefined,
    ciudadId: formData.get("ciudadId") ? Number(formData.get("ciudadId")) : undefined,
    linkUbicacion: (formData.get("linkUbicacion") as string) ?? "",
    referencia: formData.get("referencia") as string,
    latitud: formData.get("latitud") ? Number(formData.get("latitud")) : undefined,
    longitud: formData.get("longitud") ? Number(formData.get("longitud")) : undefined,
    validarAforo: formData.get("validarAforo") === "true",
    maxCapacidad: Number(formData.get("maxCapacidad")),
    imagenPortada: (formData.get("imagenPortada") as string) ?? "",
    imagenesGaleria: JSON.parse((formData.get("imagenesGaleria") as string) || "[]") as string[],
    modoConfirmacion: (formData.get("modoConfirmacion") as string) || undefined,
  };

  try {
    await spacesApi.createEspacio(data, tokens.accessToken);
  } catch (error) {
    if (error instanceof spacesApi.SpacesError) return { error: error.message };
    throw error;
  }

  redirect("/espacios");
}

export async function updateEspacio(
  id: number,
  formData: FormData,
): Promise<UpdateEspacioState> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");

  const data: spacesApi.EspacioRequest = {
    titulo: formData.get("titulo") as string,
    descripcion: formData.get("descripcion") as string,
    propietarioId: formData.get("propietarioId") as string,
    tipoEspacioId: Number(formData.get("tipoEspacioId")),
    provinciaId: formData.get("provinciaId") ? Number(formData.get("provinciaId")) : undefined,
    ciudadId: formData.get("ciudadId") ? Number(formData.get("ciudadId")) : undefined,
    linkUbicacion: (formData.get("linkUbicacion") as string) ?? "",
    referencia: formData.get("referencia") as string,
    latitud: formData.get("latitud") ? Number(formData.get("latitud")) : undefined,
    longitud: formData.get("longitud") ? Number(formData.get("longitud")) : undefined,
    validarAforo: formData.get("validarAforo") === "true",
    maxCapacidad: Number(formData.get("maxCapacidad")),
    imagenPortada: (formData.get("imagenPortada") as string) ?? "",
    imagenesGaleria: JSON.parse((formData.get("imagenesGaleria") as string) || "[]") as string[],
    modoConfirmacion: (formData.get("modoConfirmacion") as string) || undefined,
  };

  try {
    await spacesApi.updateEspacio(id, data, tokens.accessToken);
  } catch (error) {
    if (error instanceof spacesApi.SpacesError) return { error: error.message };
    throw error;
  }

  redirect("/espacios");
}

export async function activarEspacio(id: number): Promise<ActivarEspacioState> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");

  console.log(`[actions/spaces] activarEspacio: solicitado por usuario para espacioId=${id}`);
  try {
    const espacio = await spacesApi.activarEspacio(id, tokens.accessToken);
    console.log(`[actions/spaces] activarEspacio: exitoso espacioId=${id} estado=${espacio.estado} tipoEspacioId=${espacio.tipoEspacioId}`);
  } catch (error) {
    if (error instanceof spacesApi.SpacesError) {
      console.warn(`[actions/spaces] activarEspacio: fallo controlado espacioId=${id} message=${error.message}`);
      return { error: error.message };
    }
    console.error(`[actions/spaces] activarEspacio: error inesperado espacioId=${id}`, error);
    throw error;
  }

  revalidatePath("/espacios");
}

export async function inactivarEspacio(id: number): Promise<InactivarEspacioState> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");

  try {
    await spacesApi.inactivarEspacio(id, tokens.accessToken);
  } catch (error) {
    if (error instanceof spacesApi.SpacesError) return { error: error.message };
    throw error;
  }

  revalidatePath("/espacios");
}
