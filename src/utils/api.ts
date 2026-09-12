// Cliente HTTP fino para a API do backend. Centraliza a URL base, o envio de
// cookies (credentials: "include") e o parsing do formato de resposta usado
// pela API: { data: ... } em sucesso, { error: { code, message } } em falha.

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiSuccessBody<T> {
  data: T;
}

interface ApiFailureBody {
  error: { code: string; message: string; details?: unknown };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "API_URL_MISSING", "VITE_API_URL não está configurada no frontend.");
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiSuccessBody<T> | ApiFailureBody;

  if (!response.ok) {
    const failure = body as ApiFailureBody;
    throw new ApiError(
      response.status,
      failure.error?.code ?? "UNKNOWN_ERROR",
      failure.error?.message ?? "Erro desconhecido.",
      failure.error?.details
    );
  }

  return (body as ApiSuccessBody<T>).data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
}

export function apiDelete<T>(path: string, headers?: Record<string, string>): Promise<T> {
  return request<T>(path, { method: "DELETE", headers });
}