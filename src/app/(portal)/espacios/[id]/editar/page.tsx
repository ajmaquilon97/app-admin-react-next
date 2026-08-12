import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getEspacioById, getTiposEspacios } from "@/lib/api/spaces";
import { getUbicaciones } from "@/lib/api/catalogos";
import { EditarEspacioWizard } from "@/modules/spaces/components/EditarEspacioWizard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarEspacioPage({ params }: Props) {
  const { id } = await params;
  const espacioId = Number(id);
  if (isNaN(espacioId)) notFound();

  const [user, tokens] = await Promise.all([verifySession(), getSessionTokens()]);
  if (!tokens) notFound();

  const [espacio, tiposEspacios, provincias] = await Promise.all([
    getEspacioById(espacioId, tokens.accessToken).catch(() => null),
    getTiposEspacios(),
    getUbicaciones(),
  ]);

  if (!espacio) notFound();

  return (
    <EditarEspacioWizard
      user={user}
      espacio={espacio}
      tiposEspacios={tiposEspacios}
      provincias={provincias}
    />
  );
}
