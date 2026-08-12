import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getMisEspacios, getTiposEspacios } from "@/lib/api/spaces";
import { PricingPage } from "@/modules/pricing";
import type { EspacioOption } from "@/lib/domain";

export default async function TarifasPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let espacios: EspacioOption[] = [];
  if (tokens) {
    try {
      const [raw, tipos] = await Promise.all([
        getMisEspacios(tokens.accessToken),
        getTiposEspacios(),
      ]);
      const modalidadPorTipoId = new Map(tipos.map((t) => [t.id, t.modalidadReserva]));
      espacios = raw.map((e) => ({
        id: e.id,
        nombre: e.titulo ?? "Sin nombre",
        tipoEspacioNombre: e.tipoEspacioNombre ?? null,
        modalidadReserva: modalidadPorTipoId.get(e.tipoEspacioId) ?? null,
      }));
    } catch {
      // sin espacios — se muestra el estado vacío
    }
  }

  return <PricingPage espacios={espacios} />;
}
