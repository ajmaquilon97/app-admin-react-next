import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getMisEspacios, type EspacioResponse } from "@/lib/api/spaces";
import { EspaciosBrowser } from "@/modules/spaces";

export default async function MisEspaciosPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let espacios: EspacioResponse[] = [];
  if (tokens) {
    try {
      espacios = await getMisEspacios(tokens.accessToken);
    } catch (err) {
      console.error("[espacios] error al cargar mis-espacios:", err);
    }
  }

  return <EspaciosBrowser espacios={espacios} />;
}
