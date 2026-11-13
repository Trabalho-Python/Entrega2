import Link from "next/link";

export const dynamic = "force-dynamic";
import { NovoChamadoForm } from "@/components/chamados/NovoChamadoForm";
import { requireRole } from "@/lib/auth";
import { listCategories } from "@/lib/repositories/tickets";

export default async function NovoChamadoPage() {
  await requireRole("solicitante");
  let loadError: string | null = null;
  let categorias = [] as Awaited<ReturnType<typeof listCategories>>;

  try {
    categorias = await listCategories();
    if (!categorias.length) loadError = "Ainda não há categorias cadastradas para abrir um chamado.";
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar categorias do Supabase.";
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
          categorias={categorias}
          loadError={loadError}
        />
      </section>
    </div>
  );
}
