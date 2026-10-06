export type ChamadoStatus = "aberto" | "em_andamento" | "resolvido" | "fechado";
export type ChamadoPrioridade = "baixa" | "media" | "alta";

export type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: ChamadoStatus;
  prioridade: ChamadoPrioridade;
  prazo_sla: string | null;
  usuario_id: string;
  categoria_id: string;
  usuario_nome: string;
  categoria_nome: string;
  sla_vencido: boolean;
  sla_em_risco: boolean;
  created_at: string;
  updated_at: string | null;
};

export type ChamadoResumo = {
  total: number;
  abertos: number;
  em_andamento: number;
  no_prazo: number;
  em_risco: number;
  atrasados: number;
};

export type Categoria = {
  id: string;
  nome: string;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
};

export type ChamadoCreatePayload = {
  titulo: string;
  descricao: string;
  prioridade: ChamadoPrioridade;
  usuario_id: string;
  categoria_id: string;
};
