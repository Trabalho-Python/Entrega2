"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/chamados/novo", label: "Abrir chamado", icon: "plus" },
  { href: "/chamados", label: "Meus chamados", icon: "list" },
  { href: "/home", label: "Fila de chamados", icon: "inbox" },
  { href: "/relatorios", label: "Prazos (SLA)", icon: "clock" },
];

function NavigationIcon({ name }: { name: string }) {
  if (name === "plus") {
    return <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>;
  }
  if (name === "list") {
    return <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>;
  }
  if (name === "inbox") {
    return <><path d="M4 13l2-8h12l2 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>;
  }
  return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
              const active = pathname === item.href || (item.href === "/home" && pathname === "/chamados-abertos");
              return (
                <span className="nav-link-wrap" key={item.href}>
                  {index === 2 ? <span className="nav-separator" aria-hidden="true" /> : null}
                  <Link className={`nav-item ${active ? "active" : ""}`} href={item.href} aria-current={active ? "page" : undefined}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <NavigationIcon name={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                </span>
              );
            })}
          </div>
          <div className="user-area">
            <span className="user-avatar" aria-hidden="true">SR</span>
            <span className="user-copy"><strong>Samuel R.</strong><span>Resolvedor</span></span>
            <button type="button" className="logout-button" aria-label="Sair" title="Sair">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><path d="M15 8l4 4-4 4M19 12H9" />
              </svg>
            </button>
          </div>
        </nav>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
