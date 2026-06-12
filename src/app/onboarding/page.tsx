import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Completa tu registro — RecreAdmin",
};

export default async function OnboardingPage() {
  // Defensa real (además del proxy): exige sesión y entrega el usuario al wizard.
  const user = await verifySession();
  return <OnboardingWizard user={user} />;
}
