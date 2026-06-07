import type { ApiResponse } from "@/lib/api/types";

function baseUrl(): string {
  const b = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return b.replace(/\/$/, "");
}

export function buildApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl()}${p}`;
}

async function parseApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text();
  let body: ApiResponse<T>;
  try {
    body = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(`Respuesta no JSON (${res.status}): ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return body;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  return parseApiResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  return parseApiResponse<T>(res);
}

export function unwrapData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null || response.data === undefined) {
    throw new Error(response.message || "Respuesta sin datos");
  }
  return response.data;
}
