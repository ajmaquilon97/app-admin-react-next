import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getMisEspacios, getTiposEspacios } from "@/lib/spaces-api";
import { PricingQueryProvider } from "@/components/pricing/QueryProvider";
import { PricingPage } from "@/components/pricing/PricingPage";
import type { EspacioOption } from "@/lib/pricing/types";

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
      const codigoPorTipoId = new Map(tipos.map((t) => [t.id, t.codigo]));
      espacios = raw.map((e) => ({
        id: e.id,
        titulo: e.titulo ?? "Sin nombre",
        tipoEspacioNombre: e.tipoEspacioNombre ?? null,
        tipoEspacioCodigo: codigoPorTipoId.get(e.tipoEspacioId) ?? null,
      }));
    } catch {
      // sin espacios — se muestra el estado vacío
    }
  }

  return (
    <PricingQueryProvider>
      <PricingPage espacios={espacios} />
    </PricingQueryProvider>
  );
}
