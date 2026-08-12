import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { getOnboardingStatus } from "@/lib/api/usuarios";

export default async function Home() {
  const user = await verifySession();
  const tokens = await getSessionTokens();

  // `redirect()` lanza internamente — se llama una sola vez al final, fuera
  // del try/catch, para no atrapar su propio control de flujo.
  let target = "/onboarding";

  if (!tokens) {
    console.log(`[home] usuario ${user.id} sin tokens de sesión — enviando a /onboarding.`);
  } else {
    try {
      const status = await getOnboardingStatus(tokens.accessToken);
      console.log(`[home] estado del usuario ${user.id}:`, status);
      if (status.isEmailConfirmed && status.isPhoneConfirmed && status.isPersonalInfoComplete) {
        target = "/dashboard";
      }
    } catch (error) {
      // Si el backend no responde, no dejamos pasar sin validar: se manda a /onboarding.
      console.error(`[home] falló getOnboardingStatus para el usuario ${user.id}:`, error);
    }
  }

  console.log(`[home] usuario ${user.id} → redirigiendo a ${target}`);
  redirect(target);
}
