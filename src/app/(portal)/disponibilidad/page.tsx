import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getMisEspacios, getTiposEspacios } from "@/lib/api/spaces";
import { AvailabilityPage, type Espacio } from "@/modules/availability";

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
      const modalidadPorTipoId = new Map(tipos.map((t) => [t.id, t.modalidadReserva]));
      spaces = raw
        .filter((e) => e.id != null && e.titulo != null)
        .map((e) => ({
          id: e.id,
          nombre: e.titulo!,
          modalidadReserva: modalidadPorTipoId.get(e.tipoEspacioId) ?? null,
          tipoEspacioNombre: e.tipoEspacioNombre ?? null,
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
