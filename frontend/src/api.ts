const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }

  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: import("./types").User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<{ user: import("./types").User }>("/auth/me"),

  createRequest: (data: {
    clientName: string;
    phone: string;
    address: string;
    problemText: string;
    priority?: string;
  }) =>
    request<import("./types").RepairRequest>("/requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listRequests: (params?: { status?: string; assignedTo?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.assignedTo) searchParams.set("assignedTo", String(params.assignedTo));
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return request<import("./types").RepairRequest[]>(`/requests${qs ? `?${qs}` : ""}`);
  },

  getRequest: (id: number) =>
    request<import("./types").RequestDetail>(`/requests/${id}`),

  getStats: () => request<import("./types").Stats>("/requests/stats"),

  getMasters: () =>
    request<{ id: number; name: string; username: string }[]>("/requests/users/masters"),

  assignMaster: (requestId: number, masterId: number) =>
    request<import("./types").RepairRequest>(`/requests/${requestId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ masterId }),
    }),

  cancelRequest: (requestId: number) =>
    request<import("./types").RepairRequest>(`/requests/${requestId}/cancel`, {
      method: "PATCH",
    }),

  takeInWork: (requestId: number) =>
    request<import("./types").RepairRequest>(`/requests/${requestId}/take`, {
      method: "PATCH",
    }),

  completeRequest: (requestId: number) =>
    request<import("./types").RepairRequest>(`/requests/${requestId}/done`, {
      method: "PATCH",
    }),

  addComment: (requestId: number, text: string) =>
    request<import("./types").Comment>(`/requests/${requestId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};
