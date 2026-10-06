import Link from "next/link";

export const dynamic = "force-dynamic";
import { BrandPlaceholder, BrandWordmark } from "@/components/BrandPlaceholder";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { loadDashboardData } from "@/lib/api";
import { formatEta, prioridadeClass, prioridadeLabel, shortTicketId } from "@/lib/format";

const schedule = [
  { hour: "09:00", title: "Check-in de SLA", type: "Operacional" },
  { hour: "11:30", title: "Revisão de backlog", type: "Equipe" },
  { hour: "15:00", title: "Relatório do dia", type: "Gestão" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }> | { view?: string };
}) {
  const params = searchParams ? await searchParams : {};
  const isAtendimento = params.view === "atendimento";
  const { resumo, chamados, error } = await loadDashboardData();

  const totalChamados = resumo?.total ?? 0;
  const noPrazo = resumo?.no_prazo ?? 0;
  const emRisco = resumo?.em_risco ?? 0;
  const atrasados = resumo?.atrasados ?? 0;
  const onTimeRate = totalChamados ? Math.round((noPrazo / totalChamados) * 100) : 0;

  const metrics = [
    { label: "Chamados abertos", value: String(resumo?.abertos ?? 0) },
    { label: "SLA em risco", value: String(emRisco), accent: "risk" },
    { label: "Em andamento", value: String(resumo?.em_andamento ?? 0) },
  ];

  const priorityQueue = [...chamados]
    .sort((a, b) => {
      const rank = { alta: 0, media: 1, baixa: 2 };
      return rank[a.prioridade] - rank[b.prioridade];
    })
    .slice(0, 5);

  const emAtendimento = chamados.filter((ticket) => ticket.status === "em_andamento");
  const aguardando = chamados.filter((ticket) => ticket.status === "aberto");

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <BrandWordmark compact />
        </div>

        <nav className="nav">
          <Link href="/home" className={`nav-item ${!isAtendimento ? "active" : ""}`}>Abertura</Link>
          <Link href="/home?view=atendimento" className={`nav-item ${isAtendimento ? "active" : ""}`}>Atendimento</Link>
          <Link href="/chamados-abertos" className="nav-item">Chamados</Link>
          <Link href="/relatorios" className="nav-item">Relatórios</Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Buscar chamados, clientes ou categoria" />
          </div>
          <div className="user-box">
            <BrandPlaceholder label="Logo" size="sm" variant="soft" />
            <div>
              <strong>Joana Silva</strong>
              <span>Gestão de operações</span>
            </div>
          </div>
        </header>

        {error ? (
          <StatusMessage
            tone="error"
            title="API indisponível"
            description={error}
          />
        ) : null}

        {!isAtendimento ? (
          <>
            <section className="hero-panel">
              <div className="hero-status">
                <div className="hero-arc" role="img" aria-label={`${onTimeRate}% dos chamados dentro do prazo hoje`}>
                  <div className="hero-arc-label">
                    <strong>{onTimeRate}%</strong>
                    <span>no prazo</span>
                  </div>
                </div>

                <div>
                  <h1>{noPrazo} chamados seguem dentro do prazo hoje.</h1>
                  <p className="hero-subtext">{atrasados} já passaram do combinado — comece por eles.</p>
                  <ul className="hero-breakdown">
                    <li><span className="dot safe" />{noPrazo} no prazo</li>
                    <li><span className="dot watch" />{emRisco} em risco</li>
                    <li><span className="dot over" />{atrasados} atrasados</li>
                  </ul>
                </div>
              </div>

              <div className="hero-actions">
                <Link href="/chamados/novo" className="primary-button" aria-label="Abrir novo chamado">
                  <span aria-hidden="true">＋</span>
                  <span>Novo chamado</span>
                </Link>
              </div>
            </section>

            <section className="view-tabs" aria-label="Visão do sistema">
              <Link href="/home" className="tab-button active">Abertura</Link>
              <Link href="/home?view=atendimento" className="tab-button">Atendimento</Link>
            </section>

            <section className="metrics-grid">
              {metrics.map((metric) => (
                <article key={metric.label} className={`metric-card ${metric.accent ?? ""}`}>
                  <span className="metric-label">{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </section>

            <section className="board-grid">
              <article className="panel">
                <div className="panel-header-row">
                  <div>
                    <h2>Prioridade do dia</h2>
                    <p>Fila de atendimento com urgência e SLA.</p>
                  </div>
                  <Link href="/chamados-abertos" className="text-link">Ver todos</Link>
                </div>

                {priorityQueue.length === 0 ? (
                  <StatusMessage tone="empty" title="Nenhum chamado na fila" />
                ) : (
                  <div className="ticket-list compact-list">
                    {priorityQueue.map((ticket) => (
                      <div key={ticket.id} className={`ticket-row ${prioridadeClass(ticket.prioridade)}`}>
                        <div>
                          <span className="ticket-id">{shortTicketId(ticket.id)}</span>
                          <h3>{ticket.titulo}</h3>
                        </div>
                        <div className="ticket-info">
                          <span>{ticket.usuario_nome}</span>
                          <span className={`ticket-priority-label ${prioridadeClass(ticket.prioridade)}`}>
                            {prioridadeLabel(ticket.prioridade)}
                          </span>
                          <strong className="eta">{formatEta(ticket.prazo_sla, ticket.sla_vencido)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="panel">
                <div className="panel-header-row">
                  <div>
                    <h2>Agenda</h2>
                    <p>Próximas ações da operação.</p>
                  </div>
                </div>

                <div className="agenda-list">
                  {schedule.map((item) => (
                    <div key={item.hour} className="agenda-item">
                      <span className="agenda-time">{item.hour}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.type}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="attendance-shell">
            <div className="panel attendance-board">
              <div className="panel-header-row">
                <div>
                  <h2>Atendimento</h2>
                  <p>Chamados em fila e acompanhamento de suporte.</p>
                </div>
                <Link href="/chamados/novo" className="primary-button">Novo chamado</Link>
              </div>

              <div className="attendance-grid">
                <div className="attention-column">
                  <div className="stack-panel">
                    <h3>Em atendimento</h3>
                    {emAtendimento.length === 0 ? (
                      <StatusMessage tone="empty" title="Nenhum chamado em andamento" />
                    ) : (
                      <ul>
                        {emAtendimento.map((ticket) => (
                          <li key={ticket.id}>
                            <span>{shortTicketId(ticket.id)}</span>
                            <strong>{ticket.titulo}</strong>
                            <small>
                              {ticket.usuario_nome} · {formatEta(ticket.prazo_sla, ticket.sla_vencido)}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="attention-column">
                  <div className="stack-panel">
                    <h3>Aguardando resposta</h3>
                    {aguardando.length === 0 ? (
                      <StatusMessage tone="empty" title="Nenhum chamado aguardando" />
                    ) : (
                      <ul>
                        {aguardando.map((ticket) => (
                          <li key={ticket.id}>
                            <span>{shortTicketId(ticket.id)}</span>
                            <strong>{ticket.titulo}</strong>
                            <small>
                              {ticket.usuario_nome} · {formatEta(ticket.prazo_sla, ticket.sla_vencido)}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="attention-column">
                  <div className="stack-panel compact">
                    <h3>Resumo</h3>
                    <div className="mini-stat"><span>Em fila</span><strong>{resumo?.abertos ?? 0}</strong></div>
                    <div className="mini-stat"><span>Em andamento</span><strong>{resumo?.em_andamento ?? 0}</strong></div>
                    <div className="mini-stat"><span>Atrasados</span><strong>{atrasados}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
