"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import { getMisEspacios } from "@/lib/spaces-api";
import type { EspacioOption } from "@/lib/domain";

/**
 * Catálogo de espacios del anfitrión en su forma de selector, transversal a los módulos.
 *
 * Vivía en `actions/reservas.ts` y financiero lo importaba de ahí, lo que acoplaba dos
 * dominios entre sí. Al vivir en la capa transversal, ambos lo consumen sin conocerse.
 */
export async function getSpaceOptions(): Promise<EspacioOption[]> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");

  const espacios = await getMisEspacios(tokens.accessToken);
  return espacios.map((e) => ({
    id: e.id,
    nombre: e.titulo ?? "Sin nombre",
    tipoEspacioNombre: e.tipoEspacioNombre ?? null,
  }));
}
