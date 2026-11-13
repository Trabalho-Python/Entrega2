import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/NoPrazo";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "";
  if (!code) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=callback`, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=callback`, request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role;
  if (role !== "solicitante" && role !== "resolvedor") {
    return NextResponse.redirect(new URL(`${BASE_PATH}/auth/error?reason=role`, request.url));
  }
  const defaultPath = role === "resolvedor" ? "/home" : "/meus-chamados";
  const safeNext = requestedNext.startsWith(`${BASE_PATH}/`) ? requestedNext : `${BASE_PATH}${defaultPath}`;
  return NextResponse.redirect(new URL(safeNext, request.url));
}
