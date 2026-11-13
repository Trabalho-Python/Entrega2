import type { ChamadoPrioridade, ChamadoStatus } from "@/lib/types";

export function shortTicketId(id: string) {
  return `NP-${id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export function prioridadeLabel(prioridade: ChamadoPrioridade | string) {
  const labels: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
  };
  return labels[prioridade] ?? prioridade;
}

export function prioridadeClass(prioridade: string) {
  return prioridade === "media" ? "média" : prioridade;
}

export function statusLabel(status: ChamadoStatus | string) {
  const labels: Record<string, string> = {
    aberto: "Aberto",
    em_andamento: "Em andamento",
    aguardando: "Aguardando solicitante",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };
  return labels[status] ?? status;
}

export function formatEta(prazoSla: string | null, vencido: boolean) {
  if (!prazoSla) {
    return "SLA pendente";
  }
  if (vencido) {
    return "vencido";
  }
  const remaining = new Date(prazoSla).getTime() - Date.now();
  if (remaining <= 0) return "vencido";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return `${hours}h ${String(Math.max(minutes, 0)).padStart(2, "0")}m`;
}
