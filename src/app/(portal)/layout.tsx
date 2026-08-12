import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { verifyOnboardingComplete } from "@/lib/auth/dal";
import { getStatistics } from "@/modules/bookings/actions/reservas";

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
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} pendingReservas={pendingReservas} />
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
