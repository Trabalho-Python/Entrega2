import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChamadosLegacyPage() {
  const identity = await requireAnyRole();
  redirect(identity.role === "solicitante" ? "/meus-chamados" : "/home");
}
