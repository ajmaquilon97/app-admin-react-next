import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getEspacioById, getTiposEspacios } from "@/lib/spaces-api";
import { EditarEspacioWizard } from "@/components/spaces/EditarEspacioWizard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarEspacioPage({ params }: Props) {
  const { id } = await params;
  const espacioId = Number(id);
  if (isNaN(espacioId)) notFound();

  const [user, tokens] = await Promise.all([verifySession(), getSessionTokens()]);
  if (!tokens) notFound();

  const [espacio, tiposEspacios] = await Promise.all([
    getEspacioById(espacioId, tokens.accessToken).catch(() => null),
    getTiposEspacios(),
  ]);

  if (!espacio) notFound();

  return (
    <EditarEspacioWizard user={user} espacio={espacio} tiposEspacios={tiposEspacios} />
  );
}
