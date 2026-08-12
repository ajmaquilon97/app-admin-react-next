import { verifySession } from "@/lib/auth/dal";
import { TicketsSoporteModule } from "@/modules/tickets-soporte";

export default async function SoportePage() {
  await verifySession();
  return <TicketsSoporteModule />;
}
