import {
  User,
  Conversation,
  Message,
  ModelInfo,
  AdminStats,
  AuditLog,
  AICreditsBalanceInfo,
} from '../types/index.js';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || '';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('nexus_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // --- AUTH ---
  async loginWithGoogle(payload: { uid: string; email: string; name?: string | null; photoURL?: string | null }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
  },

  // --- MODELS ---
  async getModels(refresh = false): Promise<{ models: ModelInfo[]; defaultModel: string; fallbackModels: string[] }> {
    const res = await fetch(`${API_BASE_URL}/api/models?refresh=${refresh}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- CONVERSATIONS ---
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await fetch(`${API_BASE_URL}/api/chats`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createConversation(title?: string, model?: string): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE_URL}/api/chats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, model }),
    });
    return handleResponse(res);
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async renameConversation(id: string, title: string): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  async deleteConversation(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/chats/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- STREAMING CHAT ---
  async streamChat({
    conversationId,
    message,
    model,
    onStart,
    onChunk,
    onDone,
    onError,
    signal,
  }: {
    conversationId?: string;
    message: string;
    model?: string;
    onStart?: (data: { conversationId: string; model: string }) => void;
    onChunk: (chunk: string) => void;
    onDone: (data: { messageId: string; modelUsed: string }) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ conversationId, message, model }),
        signal,
      });

      if (!res.ok) {
        let errStr = 'Chat request failed';
        try {
          const errData = await res.json();
          errStr = errData.error || errStr;
        } catch (e) {
          errStr = res.statusText || errStr;
        }
        throw new Error(errStr);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response stream unavailable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'start' && onStart) {
              onStart({ conversationId: parsed.conversationId, model: parsed.model });
            } else if (parsed.type === 'chunk') {
              onChunk(parsed.content);
            } else if (parsed.type === 'done') {
              onDone({ messageId: parsed.messageId, modelUsed: parsed.modelUsed });
            } else if (parsed.type === 'error') {
              onError(new Error(parsed.error));
            }
          } catch (e) {
            // Ignore partial json parse errors
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onError(err);
    }
  },

  // --- USER PROFILE & UPGRADE ---
  async getUserUsage(): Promise<{ dailyChatsUsed: number; dailyChatLimit: number; totalChats: number; usageHistory: any[] }> {
    const res = await fetch(`${API_BASE_URL}/api/user/usage`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async upgradeUser(): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/user/upgrade`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/user/account`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- ADMIN API ---
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateAdminUser(id: string, payload: any): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteAdminUser(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminModels(refresh = false): Promise<{ catalog: ModelInfo[]; disabledModels: string[]; premiumModels: string[] }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/models?refresh=${refresh}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async saveModelPermissions(disabledModels: string[], premiumModels: string[]): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/models/permissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ disabledModels, premiumModels }),
    });
    return handleResponse(res);
  },

  async getAdminSystemPrompt(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/admin/system-prompt`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async saveAdminSystemPrompt(payload: any): Promise<{ message: string; settings: any }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/system-prompt`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getAICreditsBalance(): Promise<AICreditsBalanceInfo> {
    const res = await fetch(`${API_BASE_URL}/api/admin/aicredits/balance`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse(res);
  },
};
