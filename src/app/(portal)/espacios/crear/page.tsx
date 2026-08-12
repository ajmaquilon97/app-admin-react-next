import { verifySession } from "@/lib/auth/dal";
import { getTiposEspacios } from "@/lib/api/spaces";
import { getUbicaciones } from "@/lib/api/catalogos";
import { CrearEspacioWizard } from "@/modules/spaces";

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
