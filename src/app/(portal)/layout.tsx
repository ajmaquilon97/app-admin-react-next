import { PortalChrome } from "@/components/PortalChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { verifyOnboardingComplete } from "@/lib/auth/dal";
import { getStatistics } from "@/modules/bookings";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa real (además del chequeo optimista del proxy): si no hay sesión
  // válida, o si el onboarding no está completo (ej. volver con el botón
  // "atrás" del navegador desde mitad del wizard), redirige a /login o /onboarding.
  const user = await verifyOnboardingComplete();

  const pendingReservas = await getStatistics()
    .then((stats) => stats.pendientes)
    .catch(() => undefined);

  return (
    <QueryProvider>
      <PortalChrome user={user} pendingReservas={pendingReservas}>
        {children}
      </PortalChrome>
    </QueryProvider>
  );
}
