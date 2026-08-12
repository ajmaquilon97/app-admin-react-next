import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import { PricingPage } from "@/modules/pricing";
import type { EspacioOption } from "@/lib/domain";

export default async function TarifasPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let espacios: EspacioOption[] = [];
  if (tokens) {
    try {
      espacios = await loadEspacioOptions(tokens.accessToken);
    } catch {
      // sin espacios — se muestra el estado vacío
    }
  }

  return <PricingPage espacios={espacios} />;
}
