import Link from "next/link";

export const dynamic = "force-dynamic";
import { TicketList } from "@/components/chamados/TicketList";
import { loadDashboardData } from "@/lib/api";

export default async function ChamadosPage() {
  const { chamados, error } = await loadDashboardData();

  return (
    <div className="content-page">
      <header className="content-heading">
        <div>
          <h1>Meus chamados</h1>
          <p>Acompanhe os chamados e seus respectivos prazos.</p>
        </div>
        <Link href="/chamados/novo" className="accent-button">Abrir chamado</Link>
      </header>

      <section className="glass-panel">
        <TicketList tickets={chamados} error={error} />
      </section>
    </div>
  );
}
