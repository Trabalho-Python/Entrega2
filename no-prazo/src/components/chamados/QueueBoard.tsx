"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addTicketResponseAction, transitionTicketAction, type TicketActionResult } from "@/app/actions/tickets";
import { formatEta, prioridadeLabel, shortTicketId, statusLabel } from "@/lib/format";
import type { Chamado, ChamadoStatus } from "@/lib/types";
import { StatusMessage } from "@/components/feedback/StatusMessage";

type QueueBoardProps = { tickets: Chamado[]; error: string | null; currentUserId: string };
type QueueFilter = "todos" | "meus" | "risco";
type SlaInfo = { label: string; color: string; percent: number; level: "done" | "pending" | "paused" | "breach" | "warn" | "ok" };

function durationLabel(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days) return `${days}d${hours ? ` ${hours}h` : ""}`;
  if (hours) return `${hours}h${rest ? ` ${String(rest).padStart(2, "0")}min` : ""}`;
  return `${rest}min`;
}

function getSla(ticket: Chamado): SlaInfo {
  if (ticket.status === "resolvido" || ticket.status === "fechado") return { label: "Cumprido", color: "var(--muted)", percent: 100, level: "done" };
  if (ticket.sla_pausado_em) return { label: "Pausado", color: "var(--purple)", percent: 0, level: "paused" };
  if (!ticket.prazo_sla) return { label: "SLA pendente", color: "var(--muted)", percent: 0, level: "pending" };
  const remaining = new Date(ticket.prazo_sla).getTime() - Date.now();
  const baseMinutes = { alta: 360, media: 720, baixa: 1440 }[ticket.prioridade];
  const percent = Math.max(0, Math.min(100, Math.round((1 - remaining / (baseMinutes * 60_000)) * 100)));
  if (remaining < 0) return { label: `Estourado há ${durationLabel(Math.ceil(Math.abs(remaining) / 60_000))}`, color: "var(--danger)", percent: 100, level: "breach" };
  if (remaining <= 2 * 60 * 60 * 1000) return { label: formatEta(ticket.prazo_sla, false), color: "var(--warning)", percent, level: "warn" };
  return { label: formatEta(ticket.prazo_sla, false), color: "var(--success)", percent, level: "ok" };
}

function openedLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function QueueBoard({ tickets, error, currentUserId }: QueueBoardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<QueueFilter>("todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState(false);

  const riskTickets = useMemo(() => tickets.filter((ticket) => {
    const sla = getSla(ticket);
    return sla.level === "warn" || sla.level === "breach";
  }), [tickets]);
  const mine = useMemo(() => tickets.filter((ticket) => ticket.resolvedor_id === currentUserId), [currentUserId, tickets]);
  const shownTickets = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    return tickets.filter((ticket) => {
      const matchesSearch = !search || [ticket.titulo, shortTicketId(ticket.id), ticket.usuario_nome, ticket.categoria_nome]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(search));
      const matchesFilter = filter === "todos" || (filter === "meus" && ticket.resolvedor_id === currentUserId)
        || (filter === "risco" && riskTickets.some((riskTicket) => riskTicket.id === ticket.id));
      return matchesSearch && matchesFilter;
    });
  }, [currentUserId, filter, query, riskTickets, tickets]);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? shownTickets[0] ?? tickets[0];
  const selectedSla = selectedTicket ? getSla(selectedTicket) : null;
  const activeTickets = tickets.filter((ticket) => ticket.status !== "resolvido" && ticket.status !== "fechado");
  const breached = riskTickets.filter((ticket) => getSla(ticket).level === "breach").length;
  const summary = `${activeTickets.length} em aberto · ${riskTickets.length} com prazo em risco · ${breached} estourado${breached === 1 ? "" : "s"}`;

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket || !reply.trim() || pending) return;
    setPending(true);
    setActionError("");
    const result = await addTicketResponseAction(selectedTicket.id, reply);
    setPending(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setReply("");
    setNotice("Resposta salva no histórico do chamado.");
    router.refresh();
  }

  async function changeStatus(status: ChamadoStatus) {
    if (!selectedTicket || pending) return;
    setPending(true);
    setActionError("");
    const result: TicketActionResult = await transitionTicketAction(selectedTicket.id, status);
    setPending(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setNotice(result.warning ?? "Status atualizado e registrado no histórico.");
    router.refresh();
  }

  const owned = selectedTicket?.resolvedor_id === currentUserId;

  return (
    <div className="queue-page">
      <header className="queue-heading">
        <div><h1>Fila de chamados</h1><p>{summary}</p></div>
        <label className="queue-search">
          <span className="visually-hidden">Buscar chamados</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, ID ou pessoa" />
        </label>
      </header>

      <div className="queue-tabs" role="tablist" aria-label="Filtrar chamados">
        {([["todos", "Todos", tickets.length], ["meus", "Atribuídos a mim", mine.length], ["risco", "Prazo em risco", riskTickets.length]] as const).map(([key, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={`queue-tab ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>{label}<span>{count}</span></button>
        ))}
      </div>

      {error ? <StatusMessage tone="error" title="Não foi possível carregar a fila" description={error} /> : null}
      <div className="queue-layout">
        <section className="queue-list" aria-label="Lista de chamados">
          <div className="queue-columns"><span>Prioridade</span><span>Chamado</span><span>Status</span><span>Prazo</span></div>
          {shownTickets.map((ticket) => {
            const sla = getSla(ticket);
            const selected = selectedTicket?.id === ticket.id;
            const statusClass = ticket.status === "em_andamento" ? "progress" : ticket.status;
            return (
              <button key={ticket.id} type="button" className={`queue-row ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => { setSelectedId(ticket.id); setNotice(""); setActionError(""); }}>
                <span className={`queue-priority ${ticket.prioridade}`}>{prioridadeLabel(ticket.prioridade)}</span>
                <span className="queue-ticket-copy"><strong>{ticket.titulo}</strong><small>{shortTicketId(ticket.id)} · {ticket.usuario_nome} · {ticket.categoria_nome}</small></span>
                <span className="queue-status"><i className={`status-dot ${statusClass}`} />{statusLabel(ticket.status)}</span>
                <span className="queue-deadline"><strong style={{ color: sla.color }}>{sla.label}</strong><i className="sla-track"><i style={{ width: `${sla.percent}%`, background: sla.color }} /></i></span>
              </button>
            );
          })}
          {shownTickets.length === 0 ? <p className="queue-empty">Nenhum chamado nesta visão.</p> : null}
        </section>

        {selectedTicket && selectedSla ? (
          <aside className="ticket-detail" aria-label="Detalhe do chamado">
            <div className="detail-topline"><span>{shortTicketId(selectedTicket.id)}</span><span className="queue-status"><i className={`status-dot ${selectedTicket.status === "em_andamento" ? "progress" : selectedTicket.status}`} />{statusLabel(selectedTicket.status)}</span></div>
            <h2>{selectedTicket.titulo}</h2>
            <dl className="detail-fields">
              <div><dt>Solicitante</dt><dd>{selectedTicket.usuario_nome}</dd></div>
              <div><dt>Categoria</dt><dd>{selectedTicket.categoria_nome}</dd></div>
              <div><dt>Responsável</dt><dd className={selectedTicket.resolvedor_nome ? "" : "text-subtle"}>{selectedTicket.resolvedor_nome ?? "Sem responsável"}</dd></div>
              <div><dt>Prioridade</dt><dd className={`queue-priority ${selectedTicket.prioridade}`}>{prioridadeLabel(selectedTicket.prioridade)}</dd></div>
              <div><dt>Aberto em</dt><dd>{openedLabel(selectedTicket.created_at)}</dd></div>
              <div><dt>Prazo (SLA)</dt><dd style={{ color: selectedSla.color }}>{selectedSla.label}</dd></div>
            </dl>

            <h3 className="detail-section-title">Histórico</h3>
            <ol className="ticket-history">
              {selectedTicket.historico.map((event) => (
                <li key={event.id}><i className="history-mark" aria-hidden="true" /><div><p><strong>{event.usuario_nome ?? "Usuário"}</strong><time>{openedLabel(event.data_hora)}</time></p><span>{event.tipo === "status" ? `Status: ${event.descricao}` : event.descricao}</span></div></li>
              ))}
            </ol>

            {actionError ? <p className="status-message error" role="alert">{actionError}</p> : null}
            {notice ? <p className="reply-notice" role="status">{notice}</p> : null}
            {owned && selectedTicket.status !== "fechado" ? (
              <form className="reply-form" onSubmit={submitReply}>
                <label className="visually-hidden" htmlFor="ticket-reply">Responder ao solicitante</label>
                <textarea id="ticket-reply" rows={3} maxLength={5000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escreva uma resposta para o solicitante" />
                <div className="detail-actions">
                  <button type="submit" className="accent-button" disabled={pending || !reply.trim()}>Enviar resposta</button>
                  {selectedTicket.status === "em_andamento" ? <button type="button" className="outline-button" disabled={pending} onClick={() => changeStatus("aguardando")}>Aguardar solicitante</button> : null}
                  {selectedTicket.status === "aguardando" ? <button type="button" className="outline-button" disabled={pending} onClick={() => changeStatus("em_andamento")}>Retomar atendimento</button> : null}
                  {["em_andamento", "aguardando"].includes(selectedTicket.status) ? <button type="button" className="outline-button" disabled={pending} onClick={() => changeStatus("resolvido")}>Resolver chamado</button> : null}
                  {selectedTicket.status === "resolvido" ? <button type="button" className="outline-button" disabled={pending} onClick={() => changeStatus("fechado")}>Fechar chamado</button> : null}
                </div>
              </form>
            ) : selectedTicket.status !== "fechado" ? <p className="text-muted">Assuma este chamado para responder e atualizar o atendimento.</p> : <p className="text-muted">Este chamado foi fechado.</p>}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
