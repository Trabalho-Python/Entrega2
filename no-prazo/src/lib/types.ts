import type { ChamadoPrioridade, ChamadoStatus } from "@/lib/supabase/database.types";

export type { ChamadoPrioridade, ChamadoStatus };

export type HistoricoInteracao = {
  id: string;
  chamado_id: string;
  usuario_id: string;
  descricao: string;
  tipo: "abertura" | "mensagem" | "status" | "atribuicao";
  data_hora: string;
  usuario_nome?: string;
};

export type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: ChamadoStatus;
  prioridade: ChamadoPrioridade;
  prazo_sla: string | null;
  usuario_id: string;
  categoria_id: string;
  resolvedor_id: string | null;
  sla_pausado_em: string | null;
  sla_pausado_total: string;
  idempotency_key: string | null;
  usuario_nome: string;
  resolvedor_nome: string | null;
  categoria_nome: string;
  historico: HistoricoInteracao[];
  sla_vencido: boolean;
  sla_em_risco: boolean;
  created_at: string;
  updated_at: string | null;
};

export type Categoria = {
  id: string;
  nome: string;
};
