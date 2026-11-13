"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createChamado } from "@/lib/api";
import type { Categoria, Usuario } from "@/lib/types";

type NovoChamadoFormProps = {
  usuarios: Usuario[];
  categorias: Categoria[];
  loadError?: string | null;
};

const SLA_HINTS = {
  baixa: "24h",
  media: "12h",
  alta: "6h",
} as const;

export function NovoChamadoForm({ usuarios, categorias, loadError }: NovoChamadoFormProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
  const [usuarioId, setUsuarioId] = useState(usuarios[0]?.id ?? "");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(usuarioId && categoriaId && !loadError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createChamado({
        titulo,
        descricao,
        prioridade,
        usuario_id: usuarioId,
        categoria_id: categoriaId,
      });
      router.push("/chamados-abertos");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar o chamado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      {loadError ? (
        <p className="status-message error" role="alert">
          {loadError}
        </p>
      ) : null}
      {error ? (
        <p className="status-message error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Solicitante</span>
          <select
            required
            value={usuarioId}
            onChange={(event) => setUsuarioId(event.target.value)}
            disabled={!usuarios.length}
          >
            {usuarios.length === 0 ? (
              <option value="">Nenhum usuário cadastrado</option>
            ) : (
              usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))
            )}
          </select>
        </label>
        <label>
          <span>Categoria</span>
          <select
            required
            value={categoriaId}
            onChange={(event) => setCategoriaId(event.target.value)}
            disabled={!categorias.length}
          >
            {categorias.length === 0 ? (
              <option value="">Nenhuma categoria cadastrada</option>
            ) : (
              categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="full-width">
          <span>Título</span>
          <input
            type="text"
            required
            minLength={3}
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Descreva o assunto do chamado"
          />
        </label>
        <label className="full-width">
          <span>Descrição</span>
          <textarea
            required
            minLength={3}
            rows={6}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Descreva o problema, impacto e contexto do pedido."
          />
        </label>
        <label>
          <span>Prioridade</span>
          <select
            value={prioridade}
            onChange={(event) =>
              setPrioridade(event.target.value as "baixa" | "media" | "alta")
            }
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>
        <label>
          <span>Prazo SLA</span>
          <input type="text" readOnly value={`Calculado automaticamente (${SLA_HINTS[prioridade]})`} />
        </label>
      </div>

      <div className="form-actions">
        <Link href="/home" className="secondary-button">
          Cancelar
        </Link>
        <button type="submit" className="accent-button" disabled={submitting || !canSubmit}>
          {submitting ? "Salvando..." : "Salvar chamado"}
        </button>
      </div>
    </form>
  );
}
