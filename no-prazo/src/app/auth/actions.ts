"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Preencha+o+e-mail+e+a+senha.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;

  if (role === "resolvedor") redirect("/home");
  if (role === "solicitante") redirect("/meus-chamados");

  redirect("/auth/error?reason=role");
}

export async function registerWithEmail(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nome || !email || !password) {
    redirect("/cadastro?error=Preencha+todos+os+campos.");
  }

  if (password.length < 6) {
    redirect("/cadastro?error=A+senha+precisa+ter+pelo+menos+6+caracteres.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nome,
      },
    },
  });

  if (error) {
    redirect(`/cadastro?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Cadastro+realizado.+Confirme+o+e-mail+e+aguarde+a+atribui%C3%A7%C3%A3o+do+papel.");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/signed-out");
}
