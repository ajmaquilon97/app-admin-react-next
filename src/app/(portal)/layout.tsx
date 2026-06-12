import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { verifySession } from "@/lib/dal";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa real (además del chequeo optimista del proxy): si no hay sesión
  // válida, `verifySession` redirige a /login.
  const user = await verifySession();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
