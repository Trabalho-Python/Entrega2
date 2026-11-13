export const dynamic = "force-dynamic";

import { SlaBoard } from "@/components/chamados/SlaBoard";
import { requireRole } from "@/lib/auth";
import { listTickets } from "@/lib/repositories/tickets";
import type { Chamado } from "@/lib/types";

export default async function PrazosPage() {
  const identity = await requireRole("resolvedor");
  let tickets: Chamado[] = [];
  let errorMessage: string | null = null;
  try {
    tickets = await listTickets(identity.role, identity.id);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Falha ao carregar os prazos.";
  }
  return <SlaBoard tickets={tickets} error={errorMessage} />;
}
