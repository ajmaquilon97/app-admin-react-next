import { verifySession } from "@/lib/auth/dal";
import { getSessionTokens } from "@/lib/auth/session";
import { DashboardModule, loadDashboardData } from "@/modules/dashboard";

export default async function DashboardPage() {
  const [user, tokens] = await Promise.all([verifySession(), getSessionTokens()]);
  const data = await loadDashboardData(tokens?.accessToken ?? null);

  return <DashboardModule firstName={user.name.split(" ")[0]!} data={data} />;
}
