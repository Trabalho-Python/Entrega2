import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoPrazo",
  description: "Dashboard moderno para gestão de atendimento e SLA com integração para Supabase e FastAPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
