"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createTicketAction } from "@/app/actions/tickets";
import type { Categoria, ChamadoPrioridade } from "@/lib/types";

const SLA_HINTS: Record<ChamadoPrioridade, string> = {
  baixa: "24h corridas",
  media: "12h corridas",
  alta: "6h corridas",
};

type NovoChamadoFormProps = { categorias: Categoria[]; loadError?: string | null };

function createIdempotencyKey() {
  if (typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function NovoChamadoForm({ categorias, loadError }: NovoChamadoFormProps) {
  const router = useRouter();
  const sending = useRef(false);
  const idempotencyKey = useRef<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<ChamadoPrioridade>("media");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !categoriaId || loadError) return;
    sending.current = true;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    idempotencyKey.current ??= createIdempotencyKey();

    try {
      const result = await createTicketAction({
        idempotencyKey: idempotencyKey.current,
        titulo,
        descricao,
        prioridade,
        categoriaId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      idempotencyKey.current = null;
      setCreated(true);
      setSuccess(result.warning ?? "Chamado criado. O prazo e o histórico foram atualizados.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar o chamado.");
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      {loadError ? <p className="status-message error" role="alert">{loadError}</p> : null}
      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {success ? (
        <p className={`status-message ${success.startsWith("Chamado salvo,") ? "info" : "success"}`} role="status">
          {success} <Link href="/meus-chamados">Ver meus chamados</Link>
        </p>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Categoria</span>
          <select required value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)} disabled={!categorias.length}>
            {categorias.length === 0 ? <option value="">Nenhuma categoria disponível</option> : null}
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Prioridade</span>
          <select value={prioridade} onChange={(event) => setPrioridade(event.target.value as ChamadoPrioridade)}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>
        <label className="full-width">
          <span>Título</span>
          <input type="text" required minLength={3} maxLength={255} value={titulo} onChange={(event) => setTitulo(event.target.value)} placeholder="Descreva o assunto do chamado" />
        </label>
        <label className="full-width">
          <span>Descrição</span>
          <textarea required minLength={3} maxLength={5000} rows={6} value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Descreva o problema, impacto e contexto do pedido." />
        </label>
        <label className="full-width">
          <span>Prazo inicial de SLA</span>
          <input type="text" readOnly value={`${SLA_HINTS[prioridade]} a partir da abertura; pausa enquanto aguarda resposta.`} />
        </label>
      </div>

      <div className="form-actions">
        <Link href="/meus-chamados" className="secondary-button">Cancelar</Link>
        <button type="submit" className="accent-button" disabled={submitting || created || !categoriaId || Boolean(loadError)}>
          {submitting ? "Salvando..." : created ? "Chamado criado" : "Salvar chamado"}
        </button>
      </div>
    </form>
  );
}
