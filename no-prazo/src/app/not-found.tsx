import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="auth-notice" role="status">
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou você não tem acesso a esta área.</p>
      <Link href="/" className="accent-button">Voltar ao início</Link>
    </section>
  );
}
