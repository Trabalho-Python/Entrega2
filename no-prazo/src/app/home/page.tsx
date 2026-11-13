export const dynamic = "force-dynamic";

import { QueueBoard } from "@/components/chamados/QueueBoard";
import { requireRole } from "@/lib/auth";
import { listResolvers, listTickets } from "@/lib/repositories/tickets";
import type { Chamado } from "@/lib/types";

export default async function HomePage() {
  const identity = await requireRole("resolvedor");
  let tickets: Chamado[] = [];
  let resolvers: { id: string; nome: string }[] = [];
  let error: string | null = null;
  try {
    [tickets, resolvers] = await Promise.all([
      listTickets(identity.role, identity.id),
      listResolvers(),
    ]);
  } catch (loadError) {
    error = loadError instanceof Error ? loadError.message : "Falha ao carregar os chamados.";
  }
  return <QueueBoard tickets={tickets} resolvers={resolvers} error={error} currentUserId={identity.id} />;
}
