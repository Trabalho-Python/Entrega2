import Link from "next/link";
import { loginWithEmail } from "@/app/auth/actions";

function getMessage(searchParams: Record<string, string | string[] | undefined> | undefined, key: "error" | "message" | "reason") {
  const value = searchParams?.[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const error = getMessage(params, "error");
  const message = getMessage(params, "message");
  const reason = getMessage(params, "reason");
  const devLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

  let notice = "Acesse sua conta para continuar.";
  if (reason === "access") notice = "Faça login para continuar.";
  if (devLoginEnabled) notice = "Modo de desenvolvimento ativo. Use um usuário local.";

  return (
    <main className="public-main">
      <section className="glass-panel auth-notice" style={{ width: "min(480px, 100%)" }}>
        <p style={{ margin: 0, color: "var(--accent)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          NoPrazo
        </p>
        <h1 style={{ marginTop: 12, marginBottom: 8 }}>Entrar</h1>
        <p>{notice}</p>

        {error ? (
          <div className="status-message success" style={{ marginBottom: 18, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255, 138, 128, 0.35)", color: "var(--danger)" }}>
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {message ? (
          <div className="status-message success" style={{ marginBottom: 18, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(127, 209, 174, 0.35)", color: "var(--success)" }}>
            {decodeURIComponent(message)}
          </div>
        ) : null}

        <form action={loginWithEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--secondary)" }}>
            E-mail
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", padding: "0 14px" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--secondary)" }}>
            Senha
            <input
              name="password"
              type="password"
              required
              placeholder="********"
              style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", padding: "0 14px" }}
            />
          </label>

          <button type="submit" className="accent-button" style={{ width: "100%" }}>
            Entrar
          </button>
        </form>

        {devLoginEnabled ? (
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(126, 140, 255, 0.3)", background: "rgba(126, 140, 255, 0.08)", color: "var(--secondary)" }}>
            Usuários de teste: <strong>solicitante@noprazo.local</strong> / <strong>solicitante123</strong><br />
            ou <strong>resolvedor@noprazo.local</strong> / <strong>resolvedor123</strong>
          </div>
        ) : (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <a href="/auth/login" className="outline-button" style={{ display: "inline-flex", width: "100%", textAlign: "center" }}>
              Entrar com Google
            </a>
          </div>
        )}

        <p style={{ marginTop: 20, marginBottom: 0, color: "var(--secondary)" }}>
          Ainda não tem conta? <Link href="/cadastro">Crie uma conta</Link>
        </p>
      </section>
    </main>
  );
}
