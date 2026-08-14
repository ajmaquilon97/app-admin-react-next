import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { loadEspacioOptions } from "@/lib/api/espacios-catalogo";
import { getUbicaciones, type ProvinciaCatalogo } from "@/lib/api/catalogos";
import { ConfiguracionModule } from "@/modules/configuracion";
import type { EspacioOption } from "@/lib/domain";

export default async function ConfiguracionPage() {
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

  let provincias: ProvinciaCatalogo[] = [];
  try {
    provincias = await getUbicaciones();
  } catch {
    // catálogo público — si falla, el tab de Perfil igual funciona pero sin opciones de ubicación
  }

  return <ConfiguracionModule espacios={espacios} provincias={provincias} />;
}
