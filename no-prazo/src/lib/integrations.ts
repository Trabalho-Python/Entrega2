export const appConfig = {
  appName: "NoPrazo",
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "your-anon-key",
  apiBaseUrl:
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000",
};
