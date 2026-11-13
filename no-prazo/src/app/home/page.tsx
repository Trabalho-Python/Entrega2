export const dynamic = "force-dynamic";

import { QueueBoard } from "@/components/chamados/QueueBoard";
import { requireRole } from "@/lib/auth";
import { listTickets } from "@/lib/repositories/tickets";
import type { Chamado } from "@/lib/types";

export default async function HomePage() {
  const identity = await requireRole("resolvedor");
  let tickets: Chamado[] = [];
  let error: string | null = null;
  try {
    tickets = await listTickets(identity.role, identity.id);
  } catch (loadError) {
    error = loadError instanceof Error ? loadError.message : "Falha ao carregar os chamados.";
  }
  return <QueueBoard tickets={tickets} error={error} currentUserId={identity.id} />;
}
