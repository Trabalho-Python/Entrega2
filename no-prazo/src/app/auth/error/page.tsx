import Link from "next/link";

const messages: Record<string, string> = {
  config: "Configure a URL e a chave pública do Supabase no ambiente do Next.js.",
  access: "Entre com uma conta autorizada para acessar esta área.",
  callback: "Não foi possível concluir a autenticação. Tente novamente.",
  provider: "O provedor de autenticação não está configurado no Supabase.",
  role: "Sua conta ainda não tem o papel solicitante ou resolvedor atribuído.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <section className="auth-notice" role="alert">
      <h1>Autenticação necessária</h1>
      <p>{messages[reason ?? ""] ?? "Ocorreu um problema de autenticação."}</p>
      <Link href="/auth/login" className="accent-button">Tentar novamente</Link>
    </section>
  );
}
