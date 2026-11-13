export type Papel = "solicitante" | "resolvedor";
export type ChamadoStatus = "aberto" | "em_andamento" | "aguardando" | "resolvido" | "fechado";
export type ChamadoPrioridade = "baixa" | "media" | "alta";

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: { id: string; nome: string; email: string; created_at: string };
        Insert: { id: string; nome: string; email: string; created_at?: string };
        Update: { nome?: string; email?: string };
        Relationships: [];
      };
      categorias: {
        Row: { id: string; nome: string };
        Insert: { id?: string; nome: string };
        Update: { nome?: string };
        Relationships: [];
      };
      chamados: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao: string;
          status?: ChamadoStatus;
          prioridade: ChamadoPrioridade;
          prazo_sla?: string | null;
          usuario_id: string;
          categoria_id: string;
          resolvedor_id?: string | null;
          sla_pausado_em?: string | null;
          sla_pausado_total?: string;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chamados"]["Insert"]>;
        Relationships: [];
      };
      historico_interacoes: {
        Row: {
          id: string;
          chamado_id: string;
          usuario_id: string;
          descricao: string;
          tipo: "abertura" | "mensagem" | "status";
          data_hora: string;
        };
        Insert: {
          id?: string;
          chamado_id: string;
          usuario_id: string;
          descricao: string;
          tipo?: "abertura" | "mensagem" | "status";
          data_hora?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status_chamado: ChamadoStatus;
      prioridade_chamado: ChamadoPrioridade;
    };
    CompositeTypes: Record<string, never>;
  };
};
