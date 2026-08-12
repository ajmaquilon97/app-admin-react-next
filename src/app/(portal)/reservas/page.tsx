import { verifySession } from "@/lib/auth/dal";
import { ReservasModule } from "@/modules/bookings";

export default async function ReservasPage() {
  await verifySession();
  return <ReservasModule />;
}
