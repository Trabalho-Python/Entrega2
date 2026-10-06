import Link from "next/link";

export const dynamic = "force-dynamic";
import { BrandPlaceholder, BrandWordmark } from "@/components/BrandPlaceholder";
import { TicketList } from "@/components/chamados/TicketList";
import { loadDashboardData } from "@/lib/api";

export default async function ChamadosPage() {
  const { chamados, error } = await loadDashboardData();

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header-copy">
          <BrandWordmark compact />
          <h1>Chamados</h1>
        </div>
        <div className="page-actions">
          <BrandPlaceholder label="Logo da empresa" size="sm" variant="soft" />
          <Link href="/home" className="secondary-button">Voltar ao painel</Link>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <h2>Fila ativa</h2>
            <p>Central de tickets com foco em SLA e prioridade.</p>
          </div>
          <Link href="/chamados/novo" className="primary-button">Novo chamado</Link>
        </div>
        <TicketList tickets={chamados} error={error} />
      </section>
    </div>
  );
}
