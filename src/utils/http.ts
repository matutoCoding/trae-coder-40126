export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE = '/api';

async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    try {
      const body = await res.json();
      return { success: false, message: body.message || `请求失败: ${res.status}` };
    } catch {
      return { success: false, message: `请求失败: ${res.status}` };
    }
  }
  return res.json();
}

export const http = {
  get<T = any>(url: string, params?: Record<string, any>) {
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request<T>(`${url}${qs}`, { method: 'GET' });
  },
  post<T = any>(url: string, body?: any) {
    return request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put<T = any>(url: string, body?: any) {
    return request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T = any>(url: string) {
    return request<T>(url, { method: 'DELETE' });
  },
};
