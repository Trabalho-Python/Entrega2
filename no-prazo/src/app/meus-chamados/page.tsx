export const dynamic = "force-dynamic";

import { MyTickets } from "@/components/chamados/MyTickets";
import { requireRole } from "@/lib/auth";
import { listTickets } from "@/lib/repositories/tickets";
import type { Chamado } from "@/lib/types";

export default async function MeusChamadosPage() {
  const identity = await requireRole("solicitante");
  let tickets: Chamado[] = [];
  let errorMessage: string | null = null;
  try {
    tickets = await listTickets(identity.role, identity.id);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Falha ao carregar os chamados.";
  }
  return (
    <div className="content-page">
      <header className="content-heading"><div><h1>Meus chamados</h1><p>Seus chamados, prazos e histórico de atendimento.</p></div></header>
      <MyTickets tickets={tickets} error={errorMessage} />
    </div>
  );
}
