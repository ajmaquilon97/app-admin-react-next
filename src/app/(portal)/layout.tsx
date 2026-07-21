import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { verifySession } from "@/lib/dal";
import { getStatistics } from "@/actions/reservas";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa real (además del chequeo optimista del proxy): si no hay sesión
  // válida, `verifySession` redirige a /login.
  const user = await verifySession();

  const pendingReservas = await getStatistics()
    .then((stats) => stats.pendientes)
    .catch(() => undefined);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} pendingReservas={pendingReservas} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
