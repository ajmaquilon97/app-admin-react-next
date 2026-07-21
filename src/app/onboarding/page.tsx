import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getOnboardingStatus } from "@/lib/usuarios-api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Completa tu registro — RecreAdmin",
};

export default async function OnboardingPage() {
  const user = await verifySession();
  const tokens = await getSessionTokens();

  // Sin token no hay forma de consultar el estado — dejamos que el usuario
  // vea el wizard desde el paso 1 en vez de bloquear la página.
  if (!tokens) {
    console.log(`[onboarding] usuario ${user.id} sin tokens de sesión — se muestra el wizard desde el paso 1.`);
    return <OnboardingWizard user={user} method="email" initialStep={1} />;
  }

  let status;
  try {
    status = await getOnboardingStatus(tokens.accessToken);
  } catch (error) {
    // Si el backend no responde, no bloqueamos el onboarding — se muestra desde el inicio.
    console.error(`[onboarding] falló getOnboardingStatus para el usuario ${user.id}:`, error);
    return <OnboardingWizard user={user} method="email" initialStep={1} />;
  }

  console.log(`[onboarding] estado del usuario ${user.id}:`, status);

  if (status.isEmailConfirmed && status.isPhoneConfirmed && status.isPersonalInfoComplete) {
    console.log(`[onboarding] usuario ${user.id} ya completó todo — redirigiendo a /dashboard.`);
    redirect("/dashboard");
  }

  // El correo ya confirmado (típico de cuentas Google) reutiliza el layout
  // "google" del wizard, que no incluye el paso de verificación de correo.
  const method = status.isEmailConfirmed ? "google" : "email";
  const PHONE_STEP = method === "email" ? 2 : 1;
  const PROFILE_STEP = method === "email" ? 3 : 2;

  const initialStep = !status.isEmailConfirmed
    ? 1
    : !status.isPhoneConfirmed
      ? PHONE_STEP
      : PROFILE_STEP;

  console.log(`[onboarding] usuario ${user.id} reanuda en método="${method}", paso=${initialStep}.`);

  return <OnboardingWizard user={user} method={method} initialStep={initialStep} />;
}
