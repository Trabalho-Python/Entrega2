export const dynamic = "force-dynamic";
import { QueueBoard } from "@/components/chamados/QueueBoard";
import { loadDashboardData } from "@/lib/api";

export default async function HomePage() {
  const { chamados, error } = await loadDashboardData();
  return (
    <QueueBoard tickets={chamados} error={error} />
  );
}
