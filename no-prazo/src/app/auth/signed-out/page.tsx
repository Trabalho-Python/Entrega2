import Link from "next/link";

export default function SignedOutPage() {
  return (
    <section className="auth-notice" role="status">
      <h1>Sessão encerrada</h1>
      <p>Você saiu da sua conta com segurança.</p>
      <Link href="/auth/login" className="accent-button">Entrar novamente</Link>
    </section>
  );
}
