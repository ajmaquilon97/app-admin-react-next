import { verifySession } from "@/lib/auth/dal";
import { FinancieroModule } from "@/modules/financiero/components/FinancieroModule";

export default async function FinancieroPage() {
  await verifySession();
  return <FinancieroModule />;
}
