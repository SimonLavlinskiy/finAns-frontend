const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("finans:unauthorized"));
    }
    let message = response.statusText;
    let code: string | undefined;
    try {
      const data = await response.json();
      message = data?.error?.message ?? message;
      code = data?.error?.code;
      const fields = data?.error?.fields as Record<string, string> | undefined;
      throw new ApiError(message, response.status, code, fields);
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event("finans:unauthorized"));
    }
    let message = response.statusText;
    let code: string | undefined;
    try {
      const data = await response.json();
      message = data?.error?.message ?? message;
      code = data?.error?.code;
      throw new ApiError(message, response.status, code);
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
    throw new ApiError(message, response.status, code);
  }

  return response.json() as Promise<T>;
}

export type HealthResponse = {
  status: string;
  db: string;
  version: string;
};

export function fetchHealth() {
  return apiClient<HealthResponse>("/api/v1/health");
}
