import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getMisEspacios } from "@/lib/spaces-api";
import { AvailabilityPage } from "@/components/availability/AvailabilityPage";
import type { Espacio } from "@/components/availability/types";

export const metadata = { title: "Agenda | Agora" };

export default async function DisponibilidadPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let spaces: Espacio[] = [];
  if (tokens) {
    try {
      const raw = await getMisEspacios(tokens.accessToken);
      spaces = raw
        .filter((e) => e.id != null && e.titulo != null)
        .map((e) => ({ id: e.id, nombre: e.titulo! }));
    } catch {
      // Si falla, la página carga con lista vacía y los toasts de error
      // aparecen cuando los componentes cliente intentan cargar datos.
    }
  }

  return <AvailabilityPage spaces={spaces} />;
}
