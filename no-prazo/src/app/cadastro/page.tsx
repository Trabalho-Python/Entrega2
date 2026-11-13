import Link from "next/link";
import { registerWithEmail } from "@/app/auth/actions";

function getMessage(searchParams: Record<string, string | string[] | undefined> | undefined, key: "error" | "message") {
  const value = searchParams?.[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function CadastroPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const error = getMessage(params, "error");
  const message = getMessage(params, "message");

  return (
    <main className="public-main">
      <section className="glass-panel auth-notice" style={{ width: "min(520px, 100%)" }}>
        <p style={{ margin: 0, color: "var(--accent)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          NoPrazo
        </p>
        <h1 style={{ marginTop: 12, marginBottom: 8 }}>Criar conta</h1>
        <p>Cadastre-se para abrir e acompanhar chamados. O papel do usuário será validado pelo administrador da plataforma.</p>

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

        <form action={registerWithEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8, color: "var(--secondary)" }}>
            Nome completo
            <input
              name="nome"
              type="text"
              required
              placeholder="Seu nome"
              style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", padding: "0 14px" }}
            />
          </label>

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
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "var(--text)", padding: "0 14px" }}
            />
          </label>

          <button type="submit" className="accent-button" style={{ width: "100%" }}>
            Criar conta
          </button>
        </form>

        <p style={{ marginTop: 20, marginBottom: 0, color: "var(--secondary)" }}>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
