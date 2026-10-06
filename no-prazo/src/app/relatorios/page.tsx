export const dynamic = "force-dynamic";

import { BrandPlaceholder, BrandWordmark } from "@/components/BrandPlaceholder";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { loadDashboardData } from "@/lib/api";

export default async function RelatoriosPage() {
  const { resumo, chamados, error } = await loadDashboardData();
  const total = resumo?.total ?? 0;
  const atrasados = resumo?.atrasados ?? 0;
  const slaRisco = total ? Math.round(((resumo?.em_risco ?? 0) / total) * 100) : 0;

  const charts = [
    { label: "SLA em risco", value: `${slaRisco}%` },
    { label: "Chamados totais", value: String(total) },
    { label: "Atrasados", value: String(atrasados) },
  ];

  const byCategoria = chamados.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.categoria_nome || "Sem categoria"] =
      (acc[ticket.categoria_nome || "Sem categoria"] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header-copy">
          <BrandWordmark compact />
          <h1>Relatórios</h1>
        </div>
        <BrandPlaceholder label="Logo da empresa" size="sm" variant="soft" />
      </header>

      {error ? (
        <StatusMessage tone="error" title="Relatórios indisponíveis" description={error} />
      ) : null}

      <section className="metrics-grid compact-grid">
        {charts.map((item) => (
          <article key={item.label} className="metric-card">
            <span className="metric-label">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel chart-panel">
        <div className="panel-header-row">
          <div>
            <h2>Volume de tickets</h2>
            <p>Indicadores de desempenho por categoria e prazo.</p>
          </div>
        </div>
        {Object.keys(byCategoria).length === 0 ? (
          <StatusMessage tone="empty" title="Sem dados suficientes para o relatório" />
        ) : (
          <div className="volume-list">
            {Object.entries(byCategoria).map(([categoria, quantidade]) => (
              <div key={categoria} className="volume-row">
                <span>{categoria}</span>
                <strong>{quantidade}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
