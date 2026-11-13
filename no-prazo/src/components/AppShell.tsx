import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { AppNavLink } from "@/components/AppNavLink";
import { getAuthIdentity } from "@/lib/auth";

export async function AppShell({ children }: { children: ReactNode }) {
  let identity = null;
  try {
    identity = await getAuthIdentity();
  } catch {
    // Public auth error pages remain renderable while environment settings are being configured.
  }

  if (!identity) return <main className="public-main">{children}</main>;

  const navigation = identity.role === "solicitante"
    ? [{ href: "/chamados/novo", label: "Abrir chamado", icon: "plus" }, { href: "/meus-chamados", label: "Meus chamados", icon: "list" }]
    : [{ href: "/home", label: "Fila de chamados", icon: "inbox" }, { href: "/prazos", label: "Prazos (SLA)", icon: "clock" }];

  const icon = (name: string) => {
    if (name === "plus") return <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>;
    if (name === "list") return <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>;
    if (name === "inbox") return <><path d="M4 13l2-8h12l2 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>;
    return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
  };

  return (
    <div className="app-frame">
      <div className="ambient-glow" aria-hidden="true" />
      <div className="app-content">
        <nav className="top-nav" aria-label="Principal">
          <Link className="nav-brand" href="/home" aria-label="NoPrazo — início">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            NoPrazo
          </Link>
          <div className="nav-links">
            {navigation.map((item, index) => {
              return (
                <span className="nav-link-wrap" key={item.href}>
                  {index === 1 && identity.role === "resolvedor" ? <span className="nav-separator" aria-hidden="true" /> : null}
                  <AppNavLink href={item.href}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon(item.icon)}</svg>
                    {item.label}
                  </AppNavLink>
                </span>
              );
            })}
          </div>
          <div className="user-area">
            <span className="user-avatar" aria-hidden="true">{identity.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
            <span className="user-copy"><strong>{identity.name}</strong><span>{identity.role === "resolvedor" ? "Resolvedor" : "Solicitante"}</span></span>
            <form action={signOut}>
              <button type="submit" className="logout-button" aria-label="Sair" title="Sair">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><path d="M15 8l4 4-4 4M19 12H9" />
              </svg>
              </button>
            </form>
          </div>
        </nav>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
