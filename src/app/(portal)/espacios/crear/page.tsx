import { verifySession } from "@/lib/dal";
import { getTiposEspacios } from "@/lib/spaces-api";
import { getUbicaciones } from "@/lib/catalogos-api";
import { CrearEspacioWizard } from "@/modules/spaces/components/CrearEspacioWizard";

export default async function CrearEspacioPage() {
  const [user, tiposEspacios, provincias] = await Promise.all([
    verifySession(),
    getTiposEspacios(),
    getUbicaciones(),
  ]);
  return (
    <CrearEspacioWizard user={user} tiposEspacios={tiposEspacios} provincias={provincias} />
  );
}
