import Link from "next/link";

export const dynamic = "force-dynamic";
import { NovoChamadoForm } from "@/components/chamados/NovoChamadoForm";
import { listCategorias, listUsuarios } from "@/lib/api";

export default async function NovoChamadoPage() {
  let loadError: string | null = null;
  let usuarios = [] as Awaited<ReturnType<typeof listUsuarios>>;
  let categorias = [] as Awaited<ReturnType<typeof listCategorias>>;

  try {
    [usuarios, categorias] = await Promise.all([listUsuarios(), listCategorias()]);
    if (!usuarios.length || !categorias.length) {
      loadError =
        "Cadastre ao menos um usuário e uma categoria no banco antes de abrir chamados.";
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar usuários e categorias da API.";
  }

  return (
    <div className="content-page form-shell">
      <header className="content-heading">
        <div>
          <h1>Novo chamado</h1>
          <p>Conte o que aconteceu para encaminharmos sua solicitação.</p>
        </div>
        <Link href="/home" className="outline-button">Voltar à fila</Link>
      </header>

      <section className="glass-panel form-panel">
        <NovoChamadoForm
          usuarios={usuarios}
          categorias={categorias}
          loadError={loadError}
        />
      </section>
    </div>
  );
}
