"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addTicketResponseAction } from "@/app/actions/tickets";
import { formatEta, prioridadeLabel, shortTicketId, statusLabel } from "@/lib/format";
import type { Chamado } from "@/lib/types";
import { StatusMessage } from "@/components/feedback/StatusMessage";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function MyTickets({ tickets, error }: { tickets: Chamado[]; error: string | null }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);
  const selected = tickets.find((ticket) => ticket.id === selectedId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft.trim() || pending) return;
    setPending(true);
    setErrorMessage("");
    const result = await addTicketResponseAction(selected.id, draft);
    setPending(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setDraft("");
    setMessage("Resposta registrada no histórico.");
    router.refresh();
  }

  if (error) return <StatusMessage tone="error" title="Não foi possível carregar seus chamados" description={error} />;
  if (!tickets.length) return <StatusMessage tone="empty" title="Você ainda não abriu chamados" description="Quando abrir uma solicitação, ela aparecerá aqui com o histórico e o prazo." />;

  return (
    <div className="my-tickets-layout">
      <section className="my-ticket-list" aria-label="Seus chamados">
        {tickets.map((ticket) => (
          <button type="button" className={`my-ticket-row ${selected?.id === ticket.id ? "selected" : ""}`} key={ticket.id} onClick={() => { setSelectedId(ticket.id); setMessage(""); setErrorMessage(""); }}>
            <span className="my-ticket-copy"><small>{shortTicketId(ticket.id)} · {ticket.categoria_nome}</small><strong>{ticket.titulo}</strong></span>
            <span className="my-ticket-status"><i className={`status-dot ${ticket.status === "em_andamento" ? "progress" : ticket.status}`} />{statusLabel(ticket.status)}</span>
            <span className="my-ticket-sla" style={{ color: ticket.sla_pausado_em ? "var(--purple)" : ticket.sla_vencido ? "var(--danger)" : ticket.sla_em_risco ? "var(--warning)" : "var(--success)" }}>
              {ticket.sla_pausado_em ? "Pausado" : formatEta(ticket.prazo_sla, ticket.sla_vencido)}
            </span>
          </button>
        ))}
      </section>

      {selected ? (
        <section className="my-ticket-detail" aria-label="Detalhe e histórico">
          <div className="detail-topline"><span>{shortTicketId(selected.id)}</span><span>{prioridadeLabel(selected.prioridade)} · {selected.categoria_nome}</span></div>
          <h2>{selected.titulo}</h2>
          <p className="text-muted">Aberto em {dateLabel(selected.created_at)} · {selected.resolvedor_nome ? `Responsável: ${selected.resolvedor_nome}` : "Aguardando resolvedor"}</p>
          <h3 className="detail-section-title">Histórico</h3>
          <ol className="ticket-history">
            {selected.historico.map((event) => <li key={event.id}><i className="history-mark" aria-hidden="true" /><div><p><strong>{event.usuario_nome ?? "Usuário"}</strong><time>{dateLabel(event.data_hora)}</time></p><span>{event.tipo === "status" ? `Status: ${event.descricao}` : event.descricao}</span></div></li>)}
          </ol>
          {selected.status !== "resolvido" && selected.status !== "fechado" ? (
            <form className="reply-form" onSubmit={submit}>
              <label className="visually-hidden" htmlFor="requester-reply">Responder ao atendimento</label>
              <textarea id="requester-reply" rows={3} maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem para o resolvedor" />
              {errorMessage ? <p className="status-message error" role="alert">{errorMessage}</p> : null}
              {message ? <p className="reply-notice" role="status">{message}</p> : null}
              <button type="submit" className="accent-button" disabled={pending || !draft.trim()}>{pending ? "Enviando..." : "Enviar resposta"}</button>
            </form>
          ) : <p className="text-muted">Este chamado foi encerrado; novas respostas estão desativadas.</p>}
        </section>
      ) : null}
    </div>
  );
}
