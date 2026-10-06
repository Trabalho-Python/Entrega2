import type { Chamado, ChamadoCreatePayload, ChamadoResumo, Categoria, Usuario } from "@/lib/types";

function getApiBaseUrl(): string {
  const configuredUrl =
    typeof window === "undefined"
      ? process.env.API_INTERNAL_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;

  // No navegador, use o proxy do Next para evitar CORS e manter o endereço
  // interno do backend fora do bundle público.
  const baseUrl = configuredUrl?.trim() ||
    (typeof window === "undefined"
      ? "http://localhost:8000"
      : "/NoPrazo/api/help-desk");

  return baseUrl.replace(/\/+$/, "");
}

function formatDetail(detail: unknown): string | null {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String(item.msg);
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  return null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se o backend está ativo e se a URL configurada está correta.",
    );
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    let detail: unknown;
    try {
      detail = responseText ? JSON.parse(responseText)?.detail : null;
    } catch {
      detail = responseText;
    }
    throw new Error(formatDetail(detail) || `Erro ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<boolean> {
  try {
    const data = await request<{ status: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function listChamados(status?: string): Promise<Chamado[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<Chamado[]>(`/chamados${query}`);
}

export async function getResumo(): Promise<ChamadoResumo> {
  return request<ChamadoResumo>("/chamados/resumo");
}

export async function listCategorias(): Promise<Categoria[]> {
  return request<Categoria[]>("/categorias");
}

export async function listUsuarios(): Promise<Usuario[]> {
  return request<Usuario[]>("/usuarios");
}

export async function createChamado(payload: ChamadoCreatePayload): Promise<Chamado> {
  return request<Chamado>("/chamados", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loadDashboardData() {
  try {
    const [resumo, chamados, online] = await Promise.all([
      getResumo(),
      listChamados(),
      getHealth(),
    ]);
    return { resumo, chamados, online, error: null as string | null };
  } catch (error) {
    return {
      resumo: null,
      chamados: [] as Chamado[],
      online: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível conectar à API. Verifique se o backend está em execução.",
    };
  }
}
