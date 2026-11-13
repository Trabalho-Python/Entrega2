import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RelatoriosLegacyPage() {
  await requireRole("resolvedor");
  redirect("/prazos");
}
