import { StatusMessage } from "@/components/feedback/StatusMessage";
import { formatEta, prioridadeClass, prioridadeLabel, shortTicketId, statusLabel } from "@/lib/format";
import type { Chamado } from "@/lib/types";

type TicketListProps = {
  tickets: Chamado[];
  error?: string | null;
  emptyTitle?: string;
};

export function TicketList({
  tickets,
  error,
  emptyTitle = "Nenhum chamado encontrado",
}: TicketListProps) {
  if (error) {
    return (
      <StatusMessage
        tone="error"
        title="Não foi possível carregar os chamados"
        description={error}
      />
    );
  }

  if (tickets.length === 0) {
    return (
      <StatusMessage
        tone="empty"
        title={emptyTitle}
        description="Abra um novo chamado para começar a fila."
      />
    );
  }

  return (
    <div className="ticket-list">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="ticket-item">
          <div>
            <div className="ticket-meta">
              <span className="badge neutral">{shortTicketId(ticket.id)}</span>
              <span className={`badge ${prioridadeClass(ticket.prioridade)}`}>
                {prioridadeLabel(ticket.prioridade)}
              </span>
            </div>
            <h3>{ticket.titulo}</h3>
            <p className="text-muted">{ticket.categoria_nome}</p>
          </div>
          <div className="ticket-side">
            <span className="text-muted">{ticket.usuario_nome}</span>
            <span className="pill status">{statusLabel(ticket.status)}</span>
            <span className={`eta ${ticket.sla_vencido ? "overdue" : ""}`}>
              {formatEta(ticket.prazo_sla, ticket.sla_vencido)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
