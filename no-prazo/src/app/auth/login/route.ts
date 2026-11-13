import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/NoPrazo";

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true") {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, request.url));
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=config`, request.url));
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const role = user.app_metadata?.role;
    if (role === "solicitante" || role === "resolvedor") {
      return NextResponse.redirect(new URL(`${BASE_PATH}/${role === "resolvedor" ? "home" : "meus-chamados"}`, request.url));
    }
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=role`, request.url));
  }

  const requestedNext = request.nextUrl.searchParams.get("next") ?? "";
  const safeNext = requestedNext.startsWith(`${BASE_PATH}/`) ? requestedNext : "";
  const callbackUrl = new URL(`${BASE_PATH}/auth/callback`, request.url);
  if (safeNext) callbackUrl.searchParams.set("next", safeNext);

  const provider = process.env.SUPABASE_AUTH_PROVIDER ?? "google";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=provider`, request.url));
  }
  return NextResponse.redirect(data.url);
}
