"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { canTransitionStatus } from "@/lib/workflow";
import type { ChamadoPrioridade, ChamadoStatus } from "@/lib/supabase/database.types";

export type TicketActionResult = { ok: true; id?: string; warning?: string } | { ok: false; error: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requestSlaCalculation(ticketId: string): Promise<string | null> {
  const baseUrl = process.env.API_INTERNAL_URL?.trim();
  const apiKey = process.env.SLA_API_KEY;
  if (!baseUrl || !apiKey || apiKey.startsWith("replace-with-")) return "Chamado salvo, mas o serviço de SLA não está configurado; o prazo será calculado quando o serviço estiver disponível.";

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/sla/calcular/${ticketId}`, {
      method: "POST",
      headers: { "X-SLA-API-Key": apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return "Chamado salvo, mas não foi possível calcular o SLA. O resolvedor pode tentar novamente em Prazos.";
    return null;
  } catch {
    return "Chamado salvo, mas o serviço de SLA está indisponível. O resolvedor pode tentar novamente em Prazos.";
  }
}

export async function createTicketAction(input: {
  idempotencyKey: string;
  titulo: string;
  descricao: string;
  prioridade: ChamadoPrioridade;
  categoriaId: string;
}): Promise<TicketActionResult> {
  const identity = await requireRole("solicitante");
  if (!input || typeof input !== "object") return { ok: false, error: "Dados do chamado inválidos." };
  const titulo = typeof input.titulo === "string" ? input.titulo.trim() : "";
  const descricao = typeof input.descricao === "string" ? input.descricao.trim() : "";
  if (titulo.length < 3 || titulo.length > 255) return { ok: false, error: "O título deve ter entre 3 e 255 caracteres." };
  if (descricao.length < 3) return { ok: false, error: "A descrição deve ter ao menos 3 caracteres." };
  if (!["baixa", "media", "alta"].includes(input.prioridade)) return { ok: false, error: "Prioridade inválida." };
  if (!UUID_PATTERN.test(input.categoriaId) || !UUID_PATTERN.test(input.idempotencyKey)) return { ok: false, error: "Confira a categoria e tente novamente." };

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase.from("chamados")
    .select("id").eq("idempotency_key", input.idempotencyKey).maybeSingle();
  if (existingError) return { ok: false, error: "Não foi possível verificar o envio. Tente novamente." };
  if (existing) return { ok: true, id: existing.id };

  const { data: ticket, error } = await supabase.from("chamados").insert({
    titulo,
    descricao,
    prioridade: input.prioridade,
    usuario_id: identity.id,
    categoria_id: input.categoriaId,
    idempotency_key: input.idempotencyKey,
  }).select("id").single();
  if (error || !ticket) return { ok: false, error: "Não foi possível criar o chamado. Verifique a categoria e tente novamente." };

  const warning = await requestSlaCalculation(ticket.id);
  revalidatePath("/meus-chamados");
  revalidatePath("/prazos");
  return { ok: true, id: ticket.id, warning: warning ?? undefined };
}

export async function addTicketResponseAction(ticketId: string, message: string): Promise<TicketActionResult> {
  const identity = await requireAnyRole();
  if (typeof ticketId !== "string" || !UUID_PATTERN.test(ticketId) || typeof message !== "string") {
    return { ok: false, error: "Dados da resposta inválidos." };
  }
  const description = message.trim();
  if (!description || description.length > 5000) return { ok: false, error: "A resposta deve ter entre 1 e 5.000 caracteres." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("historico_interacoes").insert({
    chamado_id: ticketId,
    usuario_id: identity.id,
    descricao: description,
    tipo: "mensagem",
  });
  if (error) return { ok: false, error: "Não foi possível registrar a resposta. Confira se você tem acesso ao chamado." };

  revalidatePath(identity.role === "resolvedor" ? "/home" : "/meus-chamados");
  return { ok: true };
}

export async function transitionTicketAction(ticketId: string, nextStatus: ChamadoStatus): Promise<TicketActionResult> {
  const identity = await requireRole("resolvedor");
  if (typeof ticketId !== "string" || !UUID_PATTERN.test(ticketId)) return { ok: false, error: "Identificador de chamado inválido." };
  if (!["aberto", "em_andamento", "aguardando", "resolvido", "fechado"].includes(nextStatus)) {
    return { ok: false, error: "Status inválido." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error: readError } = await supabase.from("chamados")
    .select("id,status,resolvedor_id").eq("id", ticketId).maybeSingle();
  if (readError || !ticket) return { ok: false, error: "Chamado não encontrado ou sem permissão." };
  if (!canTransitionStatus(ticket.status, nextStatus)) return { ok: false, error: `Transição inválida: ${ticket.status} → ${nextStatus}.` };

  const { data: updated, error } = await supabase.from("chamados").update({
    status: nextStatus,
    resolvedor_id: identity.id,
  }).eq("id", ticketId).select("id").maybeSingle();
  if (error || !updated) return { ok: false, error: "Não foi possível atualizar o chamado. Outro resolvedor pode tê-lo assumido." };

  const warning = nextStatus === "em_andamento" && ticket.status === "aguardando"
    ? await requestSlaCalculation(ticketId)
    : null;
  revalidatePath("/home");
  revalidatePath("/prazos");
  revalidatePath("/meus-chamados");
  return { ok: true, warning: warning ?? undefined };
}

export async function assignTicketAction(ticketId: string, resolverId: string): Promise<TicketActionResult> {
  await requireRole("resolvedor");
  if (!UUID_PATTERN.test(ticketId) || !UUID_PATTERN.test(resolverId)) {
    return { ok: false, error: "Selecione um chamado e um resolvedor válidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_ticket", {
    p_ticket_id: ticketId,
    p_resolver_id: resolverId,
  });
  if (error) return { ok: false, error: "Não foi possível atribuir o chamado. Verifique se ele continua ativo e se o responsável é um resolvedor." };

  revalidatePath("/home");
  revalidatePath("/prazos");
  revalidatePath("/meus-chamados");
  return { ok: true };
}

export async function recalculateSlaAction(ticketId: string): Promise<TicketActionResult> {
  await requireRole("resolvedor");
  if (typeof ticketId !== "string" || !UUID_PATTERN.test(ticketId)) return { ok: false, error: "Identificador de chamado inválido." };
  const supabase = await createSupabaseServerClient();
  const { data: ticket, error } = await supabase.from("chamados").select("id").eq("id", ticketId).maybeSingle();
  if (error || !ticket) return { ok: false, error: "Chamado não encontrado ou sem permissão." };
  const warning = await requestSlaCalculation(ticketId);
  revalidatePath("/prazos");
  revalidatePath("/home");
  return warning ? { ok: false, error: warning } : { ok: true };
}
