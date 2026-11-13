import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";

export type AuthIdentity = {
  id: string;
  email: string;
  name: string;
  role: Papel;
};

export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = user.app_metadata?.role;
  if (role !== "solicitante" && role !== "resolvedor") return null;

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.nome ?? user.user_metadata?.full_name ?? user.email ?? "Usuário",
    role,
  };
}

export async function requireRole(role: Papel) {
  const identity = await getAuthIdentity();
  if (!identity) redirect("/login?reason=access");
  if (identity.role !== role) {
    redirect(identity.role === "resolvedor" ? "/home" : "/meus-chamados");
  }
  return identity;
}

export async function requireAnyRole() {
  const identity = await getAuthIdentity();
  if (!identity) redirect("/login?reason=access");
  return identity;
}
