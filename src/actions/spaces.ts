"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionTokens } from "@/lib/session";
import * as spacesApi from "@/lib/spaces-api";

export type CreateEspacioState = { error?: string } | undefined;
export type UpdateEspacioState = { error?: string } | undefined;
export type ActivarEspacioState = { error?: string } | undefined;

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
    ciudad: formData.get("ciudad") as string,
    provincia: formData.get("provincia") as string,
    linkUbicacion: (formData.get("linkUbicacion") as string) ?? "",
    referencia: formData.get("referencia") as string,
    validarAforo: formData.get("validarAforo") === "true",
    maxCapacidad: Number(formData.get("maxCapacidad")),
    imagenPortada: (formData.get("imagenPortada") as string) ?? "",
    imagenesGaleria: JSON.parse((formData.get("imagenesGaleria") as string) || "[]") as string[],
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
    ciudad: formData.get("ciudad") as string,
    provincia: formData.get("provincia") as string,
    linkUbicacion: (formData.get("linkUbicacion") as string) ?? "",
    referencia: formData.get("referencia") as string,
    validarAforo: formData.get("validarAforo") === "true",
    maxCapacidad: Number(formData.get("maxCapacidad")),
    imagenPortada: (formData.get("imagenPortada") as string) ?? "",
    imagenesGaleria: JSON.parse((formData.get("imagenesGaleria") as string) || "[]") as string[],
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

  try {
    await spacesApi.activarEspacio(id, tokens.accessToken);
  } catch (error) {
    if (error instanceof spacesApi.SpacesError) return { error: error.message };
    throw error;
  }

  revalidatePath("/espacios");
}
