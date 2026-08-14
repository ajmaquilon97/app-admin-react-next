"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import type { EspacioOption } from "@/lib/domain";

/**
 * Catálogo de espacios para el cliente (hooks de React Query).
 *
 * Vivía en `actions/reservas.ts` y financiero lo importaba de ahí, lo que acoplaba dos
 * dominios entre sí. Al vivir en la capa transversal, ambos lo consumen sin conocerse.
 *
 * Desde el servidor (páginas, actions de dominio) usa `loadEspacioOptions(token)`
 * directamente: evita volver a descifrar la cookie de sesión.
 */
export async function getSpaceOptions(): Promise<EspacioOption[]> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return loadEspacioOptions(tokens.accessToken);
}
