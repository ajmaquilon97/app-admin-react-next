import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import { AvailabilityPage, type Espacio } from "@/modules/availability";

export const metadata = { title: "Agenda | Agora" };

export default async function DisponibilidadPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let spaces: Espacio[] = [];
  if (tokens) {
    try {
      spaces = await loadEspacioOptions(tokens.accessToken);
    } catch {
      // Si falla, la página carga con lista vacía y los toasts de error
      // aparecen cuando los componentes cliente intentan cargar datos.
    }
  }

  return <AvailabilityPage spaces={spaces} />;
}
