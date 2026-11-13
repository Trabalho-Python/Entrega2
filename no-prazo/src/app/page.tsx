import { redirect } from "next/navigation";
import { getAuthIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const identity = await getAuthIdentity();
  if (!identity) redirect("/auth/login");
  redirect(identity.role === "resolvedor" ? "/home" : "/meus-chamados");
}
