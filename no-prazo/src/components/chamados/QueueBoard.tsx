"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatEta, prioridadeLabel, shortTicketId, statusLabel } from "@/lib/format";
import type { Chamado } from "@/lib/types";
import { StatusMessage } from "@/components/feedback/StatusMessage";

type QueueBoardProps = {
  tickets: Chamado[];
  error: string | null;
};

type QueueFilter = "todos" | "meus" | "risco";

function formatDuration(minutes: number) {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d${hours ? ` ${hours}h` : ""}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours}h${rest ? ` ${String(rest).padStart(2, "0")}min` : ""}`;
  }
  return `${minutes}min`;
}

function slaFor(ticket: Chamado) {
  if (ticket.status === "resolvido" || ticket.status === "fechado") {
    return { label: "Cumprido", color: "var(--muted)", percent: 100, level: "done" };
  }
  if (!ticket.prazo_sla) {
    return { label: "SLA pendente", color: "var(--muted)", percent: 0, level: "pending" };
  }

  const remainingMs = new Date(ticket.prazo_sla).getTime() - Date.now();
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  const totalMinutes = { alta: 360, media: 720, baixa: 1440 }[ticket.prioridade] ?? 720;
  const elapsed = Math.min(1, Math.max(0, 1 - remainingMinutes / totalMinutes));

  if (ticket.sla_vencido || remainingMinutes < 0) {
    return {
      label: `Estourado há ${formatDuration(Math.max(1, Math.ceil(Math.abs(remainingMs) / 60_000)))}`,
      color: "var(--danger)",
      percent: 100,
      level: "breach",
    };
  }
  if (ticket.sla_em_risco) {
    return { label: formatEta(ticket.prazo_sla, false), color: "var(--warning)", percent: Math.round(elapsed * 100), level: "warn" };
  }
  return { label: formatEta(ticket.prazo_sla, false), color: "var(--success)", percent: Math.round(elapsed * 100), level: "ok" };
}

function openedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function QueueBoard({ tickets, error }: QueueBoardProps) {
  const [filter, setFilter] = useState<QueueFilter>("todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState("");

  const riskTickets = useMemo(
    () => tickets.filter((ticket) => ticket.sla_em_risco || ticket.sla_vencido),
    [tickets],
  );
  const inProgressTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "em_andamento"),
    [tickets],
  );
  const shownTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return tickets.filter((ticket) => {
      const matchesQuery = !normalizedQuery || [
        ticket.titulo,
        shortTicketId(ticket.id),
        ticket.usuario_nome,
        ticket.categoria_nome,
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
      const matchesFilter = filter === "todos"
        || (filter === "meus" && ticket.status === "em_andamento")
        || (filter === "risco" && (ticket.sla_em_risco || ticket.sla_vencido));
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, tickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? shownTickets[0] ?? tickets[0];
  const selectedSla = selectedTicket ? slaFor(selectedTicket) : null;
  const selectedReplies = selectedTicket ? replies[selectedTicket.id] ?? [] : [];
  const openCount = tickets.filter((ticket) => ticket.status !== "resolvido" && ticket.status !== "fechado").length;
  const breachedCount = tickets.filter((ticket) => slaFor(ticket).level === "breach").length;
  const summary = `${openCount} em aberto · ${riskTickets.length} com prazo em risco · ${breachedCount} estourado${breachedCount === 1 ? "" : "s"}`;

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setReplies((current) => ({
      ...current,
      [selectedTicket.id]: [...(current[selectedTicket.id] ?? []), reply.trim()],
    }));
    setReply("");
    setNotice("Resposta adicionada ao histórico desta sessão.");
  }

  return (
    <div className="queue-page">
      <header className="queue-heading">
        <div>
          <h1>Fila de chamados</h1>
          <p>{summary}</p>
        </div>
        <label className="queue-search">
          <span className="visually-hidden">Buscar chamados</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" />
          </svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, ID ou pessoa" />
        </label>
      </header>

      <div className="queue-tabs" role="tablist" aria-label="Filtrar chamados">
        {([
          ["todos", "Todos", tickets.length],
          ["meus", "Meus", inProgressTickets.length],
          ["risco", "Prazo em risco", riskTickets.length],
        ] as const).map(([key, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={`queue-tab ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
            {label}<span>{count}</span>
          </button>
        ))}
      </div>

      {error ? <StatusMessage tone="error" title="Não foi possível carregar a fila" description={error} /> : null}

      <div className="queue-layout">
        <section className="queue-list" aria-label="Lista de chamados">
          <div className="queue-columns"><span>Prioridade</span><span>Chamado</span><span>Status</span><span>Prazo</span></div>
          {shownTickets.map((ticket) => {
            const sla = slaFor(ticket);
            const isSelected = selectedTicket?.id === ticket.id;
            const statusClass = ticket.status === "em_andamento" ? "progress" : ticket.status;
            return (
              <button key={ticket.id} type="button" className={`queue-row ${isSelected ? "selected" : ""}`} aria-pressed={isSelected} onClick={() => { setSelectedId(ticket.id); setNotice(""); }}>
                <span className={`queue-priority ${ticket.prioridade}`}>{prioridadeLabel(ticket.prioridade)}</span>
                <span className="queue-ticket-copy">
                  <strong>{ticket.titulo}</strong>
                  <small>{shortTicketId(ticket.id)} · {ticket.usuario_nome} · {ticket.categoria_nome}</small>
                </span>
                <span className="queue-status"><i className={`status-dot ${statusClass}`} />{statusLabel(ticket.status)}</span>
                <span className="queue-deadline">
                  <strong style={{ color: sla.color }}>{sla.label}</strong>
                  <i className="sla-track"><i style={{ width: `${sla.percent}%`, background: sla.color }} /></i>
                </span>
              </button>
            );
          })}
          {shownTickets.length === 0 ? <p className="queue-empty">Nenhum chamado nesta visão.</p> : null}
        </section>

        {selectedTicket && selectedSla ? (
          <aside className="ticket-detail" aria-label="Detalhe do chamado">
            <div className="detail-topline">
              <span>{shortTicketId(selectedTicket.id)}</span>
              <span className="queue-status"><i className={`status-dot ${selectedTicket.status === "em_andamento" ? "progress" : selectedTicket.status}`} />{statusLabel(selectedTicket.status)}</span>
            </div>
            <h2>{selectedTicket.titulo}</h2>
            <dl className="detail-fields">
              <div><dt>Solicitante</dt><dd>{selectedTicket.usuario_nome}</dd></div>
              <div><dt>Setor</dt><dd>{selectedTicket.categoria_nome}</dd></div>
              <div><dt>Responsável</dt><dd className="text-subtle">Não informado</dd></div>
              <div><dt>Prioridade</dt><dd className={`queue-priority ${selectedTicket.prioridade}`}>{prioridadeLabel(selectedTicket.prioridade)}</dd></div>
              <div><dt>Aberto em</dt><dd>{openedLabel(selectedTicket.created_at)}</dd></div>
              <div><dt>Prazo (SLA)</dt><dd style={{ color: selectedSla.color }}>{selectedSla.label}</dd></div>
            </dl>

            <h3 className="detail-section-title">Histórico</h3>
            <ol className="ticket-history">
              <li>
                <i className="history-mark" aria-hidden="true" />
                <div><p><strong>{selectedTicket.usuario_nome}</strong><time>{openedLabel(selectedTicket.created_at)}</time></p><span>Abriu o chamado: {selectedTicket.descricao}</span></div>
              </li>
              {selectedReplies.map((message, index) => (
                <li key={`${selectedTicket.id}-reply-${index}`}>
                  <i className="history-mark" aria-hidden="true" />
                  <div><p><strong>Samuel R.</strong><time>Agora</time></p><span>{message}</span></div>
                </li>
              ))}
            </ol>

            <form className="reply-form" onSubmit={submitReply}>
              <label className="visually-hidden" htmlFor="ticket-reply">Responder ao solicitante</label>
              <textarea id="ticket-reply" rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escreva uma resposta para o solicitante" />
              {notice ? <p className="reply-notice" role="status">{notice}</p> : null}
              <div className="detail-actions">
                <button type="submit" className="accent-button" disabled={!reply.trim()}>Enviar resposta</button>
                <button type="button" className="outline-button" onClick={() => setNotice("A resolução só pode ser registrada quando a API oferecer essa ação.")}>Resolver chamado</button>
              </div>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
