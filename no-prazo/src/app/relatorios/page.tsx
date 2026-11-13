export const dynamic = "force-dynamic";

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
    <div className="content-page">
      <header className="content-heading">
        <div>
          <h1>Relatórios</h1>
          <p>Indicadores de atendimento e cumprimento dos prazos.</p>
        </div>
      </header>

      {error ? (
        <StatusMessage tone="error" title="Relatórios indisponíveis" description={error} />
      ) : null}

      <section className="report-metrics">
        {charts.map((item) => (
          <article key={item.label} className="report-metric">
            <span className="metric-label">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="glass-panel chart-panel">
        <div className="content-heading panel-heading">
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
