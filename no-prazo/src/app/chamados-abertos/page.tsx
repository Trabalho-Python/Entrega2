import Link from "next/link";

export const dynamic = "force-dynamic";
import { TicketList } from "@/components/chamados/TicketList";
import { loadDashboardData } from "@/lib/api";

export default async function ChamadosAbertosPage() {
  const { chamados, error } = await loadDashboardData();
  const abertos = chamados.filter(
    (ticket) => ticket.status === "aberto" || ticket.status === "em_andamento",
  );

  return (
    <div className="content-page">
      <header className="content-heading">
        <div>
          <h1>Fila de chamados</h1>
          <p>{abertos.length} chamados aguardando atendimento ou em andamento.</p>
        </div>
        <Link href="/chamados/novo" className="accent-button">Abrir chamado</Link>
      </header>

      <section className="glass-panel">
        <TicketList
          tickets={abertos}
          error={error}
          emptyTitle="Não há chamados abertos"
        />
      </section>
    </div>
  );
}
