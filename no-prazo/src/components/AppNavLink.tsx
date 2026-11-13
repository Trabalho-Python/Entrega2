"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href === "/home" && pathname === "/chamados-abertos");
  return (
    <Link className={`nav-item ${active ? "active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
