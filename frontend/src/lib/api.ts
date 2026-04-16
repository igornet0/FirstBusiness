const base = () =>
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base()}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}

export type MissionDto = {
  id: string;
  level: number;
  levelName: string;
  title: string;
  description: string;
  tasks: string[];
  xp: number;
  completedTasks: boolean[];
  status: "locked" | "active" | "completed";
};

export type MeResponse = {
  email: string;
  xp: number;
  level: number;
  path: string;
  missions: MissionDto[];
  activeMissionId: string | null;
  progressPct: number;
};

export type AiMode = "chat" | "ideas" | "offer" | "analyze";

export type AiConversationDto = {
  id: string;
  userId?: string;
  title: string;
  mode: AiMode;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
};

export type AiMessageDto = {
  id: string;
  conversationId: string;
  role: "user" | "mascot";
  content: string;
  createdAt: string;
};

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; xp: number } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; xp: number } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  me: (token: string) =>
    request<MeResponse>("/api/me", { token }),
  toggleTask: (token: string, missionId: string, taskIndex: number) =>
    request<{
      xp: number;
      level: number;
      missions: MissionDto[];
      activeMissionId: string | null;
      progressPct: number;
    }>(`/api/missions/${missionId}/tasks/${taskIndex}`, {
      method: "PATCH",
      token,
    }),
  completeMission: (token: string, missionId: string, answers: string[]) =>
    request<{
      xp: number;
      level: number;
      missions: MissionDto[];
      activeMissionId: string | null;
      progressPct: number;
    }>(`/api/missions/${missionId}/complete`, {
      method: "POST",
      token,
      body: JSON.stringify({ answers }),
    }),
  missionAnswers: (token: string, missionId: string) =>
    request<{ answers: string[] }>(`/api/missions/${missionId}/answers`, {
      token,
    }),
  upsertMissionAnswer: (
    token: string,
    missionId: string,
    taskIndex: number,
    answer: string
  ) =>
    request<{ ok: boolean }>(
      `/api/missions/${missionId}/answers/${taskIndex}`,
      {
        method: "PUT",
        token,
        body: JSON.stringify({ answer }),
      }
    ),
  mission: (token: string, missionId: string) =>
    request<MissionDto>(`/api/missions/${missionId}`, { token }),
  ai: (
    token: string,
    message: string,
    mode: string,
    opts?: { lang?: "ru" | "en" }
  ) =>
    request<{ reply: string }>("/api/ai", {
      method: "POST",
      token,
      body: JSON.stringify({
        message,
        mode,
        ...(opts?.lang ? { lang: opts.lang } : {}),
      }),
    }),
  aiConversations: (
    token: string,
    opts?: { mode?: AiMode; limit?: number }
  ) => {
    const params = new URLSearchParams();
    if (opts?.mode) params.set("mode", opts.mode);
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    const q = params.toString();
    return request<{ items: AiConversationDto[] }>(
      `/api/ai/conversations${q ? `?${q}` : ""}`,
      { token }
    );
  },
  aiCreateConversation: (
    token: string,
    body: { title?: string; mode?: AiMode }
  ) =>
    request<AiConversationDto>("/api/ai/conversations", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  aiMessages: (token: string, conversationId: string) =>
    request<{ items: AiMessageDto[] }>(
      `/api/ai/conversations/${conversationId}/messages`,
      { token }
    ),
  aiSendMessage: (
    token: string,
    conversationId: string,
    content: string,
    opts?: { mode?: AiMode; lang?: "ru" | "en" }
  ) =>
    request<{
      userMessage: AiMessageDto;
      mascotMessage: AiMessageDto;
      conversation?: AiConversationDto;
    }>(`/api/ai/conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: JSON.stringify({
        content,
        ...(opts?.mode ? { mode: opts.mode } : {}),
        ...(opts?.lang ? { lang: opts.lang } : {}),
      }),
    }),
};
