"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recalculateSlaAction } from "@/app/actions/tickets";
import { formatEta, prioridadeLabel, shortTicketId, statusLabel } from "@/lib/format";
import type { Chamado } from "@/lib/types";
import { StatusMessage } from "@/components/feedback/StatusMessage";

type SlaView = "todos" | "estourados" | "risco" | "prazo" | "pausados";

function classify(ticket: Chamado, now: number): SlaView | "pausado" | "concluido" | "pendente" {
  if (ticket.status === "resolvido" || ticket.status === "fechado") return "concluido";
  if (ticket.sla_pausado_em) return "pausado";
  if (!ticket.prazo_sla) return "pendente";
  const remaining = new Date(ticket.prazo_sla).getTime() - now;
  if (remaining < 0) return "estourados";
  if (remaining <= 2 * 60 * 60 * 1000) return "risco";
  return "prazo";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function SlaBoard({ tickets, error }: { tickets: Chamado[]; error: string | null }) {
  const router = useRouter();
  const [view, setView] = useState<SlaView>("todos");
  const [now, setNow] = useState(() => Date.now());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTickets = tickets.filter((ticket) => ticket.status !== "resolvido" && ticket.status !== "fechado");
  const counts = {
    estourados: activeTickets.filter((ticket) => classify(ticket, now) === "estourados").length,
    risco: activeTickets.filter((ticket) => classify(ticket, now) === "risco").length,
    prazo: activeTickets.filter((ticket) => classify(ticket, now) === "prazo").length,
    pausados: activeTickets.filter((ticket) => classify(ticket, now) === "pausado").length,
  };
  const filtered = view === "todos" ? activeTickets : activeTickets.filter((ticket) => classify(ticket, now) === (view === "pausados" ? "pausado" : view));

  async function recalculate(id: string) {
    setPendingId(id);
    setActionError("");
    const result = await recalculateSlaAction(id);
    setPendingId(null);
    if (!result.ok) setActionError(result.error);
    else router.refresh();
  }

  return (
    <div className="content-page sla-page">
      <header className="content-heading"><div><h1>Prazos (SLA)</h1><p>Tempo restante dos chamados ativos; prazos pausam enquanto aguardam resposta.</p></div></header>
      {error ? <StatusMessage tone="error" title="Não foi possível carregar os prazos" description={error} /> : null}
      {actionError ? <StatusMessage tone="error" title="Falha ao recalcular o SLA" description={actionError} /> : null}
      <div className="sla-summary" aria-label="Resumo dos chamados por prazo">
        <p><strong className="danger-text">{counts.estourados}</strong><span>Estourados</span></p>
        <p><strong className="warning-text">{counts.risco}</strong><span>Em risco</span></p>
        <p><strong className="success-text">{counts.prazo}</strong><span>Dentro do prazo</span></p>
        <p><strong>{counts.pausados}</strong><span>Pausados</span></p>
      </div>
      <div className="queue-tabs" role="tablist" aria-label="Filtrar por estado do SLA">
        {([["todos", "Todos", activeTickets.length], ["estourados", "Estourados", counts.estourados], ["risco", "Em risco", counts.risco], ["prazo", "Dentro do prazo", counts.prazo], ["pausados", "Pausados", counts.pausados]] as const).map(([key, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} className={`queue-tab ${view === key ? "active" : ""}`} onClick={() => setView(key)}>{label}<span>{count}</span></button>
        ))}
      </div>
      {!error && filtered.length === 0 ? <StatusMessage tone="empty" title="Nenhum chamado nesta visão" /> : null}
      <section className="sla-list" aria-label="Prazos dos chamados">
        {filtered.map((ticket) => {
          const level = classify(ticket, now);
          const color = level === "estourados" ? "var(--danger)" : level === "risco" ? "var(--warning)" : level === "pausado" ? "var(--purple)" : "var(--success)";
          const value = level === "pausado" ? "Pausado" : level === "pendente" ? "Cálculo pendente" : level === "estourados" ? `Estourado · ${formatEta(ticket.prazo_sla, true)}` : formatEta(ticket.prazo_sla, false);
          return (
            <article className="sla-row" key={ticket.id}>
              <div className="sla-ticket"><span>{shortTicketId(ticket.id)} · {prioridadeLabel(ticket.prioridade)}</span><strong>{ticket.titulo}</strong><small>{ticket.usuario_nome} · {ticket.categoria_nome} · {statusLabel(ticket.status)}</small></div>
              <div className="sla-owner"><span>Responsável</span><strong>{ticket.resolvedor_nome ?? "Sem responsável"}</strong></div>
              <div className="sla-time"><span style={{ color }}>{value}</span><small>{ticket.prazo_sla ? `Prazo: ${dateLabel(ticket.prazo_sla)}` : "Prazo indisponível"}</small></div>
              {!ticket.prazo_sla ? <button className="outline-button" type="button" disabled={pendingId === ticket.id} onClick={() => recalculate(ticket.id)}>{pendingId === ticket.id ? "Calculando..." : "Tentar calcular"}</button> : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
