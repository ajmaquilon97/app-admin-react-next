import { verifySession } from "@/lib/dal";
import { TicketsSoporteModule } from "@/modules/tickets-soporte/components/TicketsSoporteModule";

export default async function SoportePage() {
  await verifySession();
  return <TicketsSoporteModule />;
}
