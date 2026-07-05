import { verifySession } from "@/lib/dal";
import { getTiposEspacios } from "@/lib/spaces-api";
import { CrearEspacioWizard } from "@/components/spaces/CrearEspacioWizard";

export default async function CrearEspacioPage() {
  const [user, tiposEspacios] = await Promise.all([
    verifySession(),
    getTiposEspacios(),
  ]);
  return <CrearEspacioWizard user={user} tiposEspacios={tiposEspacios} />;
}
