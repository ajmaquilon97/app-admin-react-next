import { verifySession } from "@/lib/auth/dal";
import { ReservasModule } from "@/modules/bookings/components/ReservasModule";

export default async function ReservasPage() {
  await verifySession();
  return <ReservasModule />;
}
