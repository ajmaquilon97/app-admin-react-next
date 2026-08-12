import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getMisEspacios } from "@/lib/api/spaces";
import { getUbicaciones, type ProvinciaCatalogo } from "@/lib/api/catalogos";
import { ConfiguracionModule } from "@/modules/configuracion";
import type { EspacioOption } from "@/lib/domain";

export default async function ConfiguracionPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let espacios: EspacioOption[] = [];
  if (tokens) {
    try {
      const raw = await getMisEspacios(tokens.accessToken);
      espacios = raw.map((e) => ({ id: e.id, nombre: e.titulo ?? "Sin nombre" }));
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
