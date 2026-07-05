import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Completa tu registro — RecreAdmin",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const user = await verifySession();
  const { method } = await searchParams;
  const registrationMethod = method === "google" ? "google" : "email";
  return <OnboardingWizard user={user} method={registrationMethod} />;
}
