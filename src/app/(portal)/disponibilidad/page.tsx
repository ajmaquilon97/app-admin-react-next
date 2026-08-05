import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getMisEspacios, getTiposEspacios } from "@/lib/spaces-api";
import { AvailabilityPage } from "@/components/availability/AvailabilityPage";
import type { Espacio } from "@/components/availability/types";

export const metadata = { title: "Agenda | Agora" };

export default async function DisponibilidadPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let spaces: Espacio[] = [];
  if (tokens) {
    try {
      const [raw, tipos] = await Promise.all([
        getMisEspacios(tokens.accessToken),
        getTiposEspacios(),
      ]);
      const codigoPorTipoId = new Map(tipos.map((t) => [t.id, t.codigo]));
      spaces = raw
        .filter((e) => e.id != null && e.titulo != null)
        .map((e) => ({
          id: e.id,
          nombre: e.titulo!,
          tipoEspacioCodigo: codigoPorTipoId.get(e.tipoEspacioId) ?? null,
          maxCapacidad: e.maxCapacidad,
          validarAforo: e.validarAforo,
        }));
    } catch {
      // Si falla, la página carga con lista vacía y los toasts de error
      // aparecen cuando los componentes cliente intentan cargar datos.
    }
  }

  return <AvailabilityPage spaces={spaces} />;
}
