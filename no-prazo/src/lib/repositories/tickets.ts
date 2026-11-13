import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";
import type { Categoria, Chamado, HistoricoInteracao } from "@/lib/types";

function throwOnError(error: { message: string } | null, message: string): void {
  if (error) throw new Error(message);
}

export async function listCategories(): Promise<Categoria[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categorias").select("id,nome").order("nome");
  throwOnError(error, "Não foi possível carregar categorias. Verifique a conexão e as permissões do Supabase.");
  return data ?? [];
}

export async function listTickets(role: Papel, userId: string): Promise<Chamado[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("chamados").select("*").order("created_at", { ascending: false });
  if (role === "solicitante") query = query.eq("usuario_id", userId);

  const { data: rows, error } = await query;
  throwOnError(error, "Não foi possível carregar chamados. Verifique a conexão e as policies do Supabase.");
  if (!rows?.length) return [];

  const ticketIds = rows.map((row) => row.id);
  const profileIds = [...new Set(rows.flatMap((row) => [row.usuario_id, row.resolvedor_id].filter((id): id is string => Boolean(id))))];
  const [profilesResult, categoriesResult, historyResult] = await Promise.all([
    supabase.from("usuarios").select("id,nome").in("id", profileIds),
    supabase.from("categorias").select("id,nome").in("id", [...new Set(rows.map((row) => row.categoria_id))]),
    supabase.from("historico_interacoes").select("id,chamado_id,usuario_id,descricao,tipo,data_hora")
      .in("chamado_id", ticketIds).order("data_hora", { ascending: true }),
  ]);
  throwOnError(profilesResult.error, "Não foi possível carregar participantes do histórico.");
  throwOnError(categoriesResult.error, "Não foi possível carregar as categorias dos chamados.");
  throwOnError(historyResult.error, "Não foi possível carregar o histórico dos chamados.");

  const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.nome]));
  const categories = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.nome]));
  const histories = new Map<string, HistoricoInteracao[]>();
  for (const event of historyResult.data ?? []) {
    const events = histories.get(event.chamado_id) ?? [];
    events.push({ ...event, usuario_nome: names.get(event.usuario_id) ?? "Usuário" });
    histories.set(event.chamado_id, events);
  }

  return rows.map((row) => ({
    ...row,
    usuario_nome: names.get(row.usuario_id) ?? "Solicitante",
    resolvedor_nome: row.resolvedor_id ? names.get(row.resolvedor_id) ?? "Resolvedor" : null,
    categoria_nome: categories.get(row.categoria_id) ?? "Sem categoria",
    historico: histories.get(row.id) ?? [],
    sla_vencido: Boolean(row.prazo_sla && new Date(row.prazo_sla).getTime() < Date.now() && !row.sla_pausado_em),
    sla_em_risco: Boolean(row.prazo_sla && !row.sla_pausado_em && new Date(row.prazo_sla).getTime() >= Date.now() && new Date(row.prazo_sla).getTime() <= Date.now() + 2 * 60 * 60 * 1000),
  }));
}

