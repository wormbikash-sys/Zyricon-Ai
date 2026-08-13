export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'USER' | 'ADMIN';
  accountType: 'FREE' | 'PREMIUM';
  premium: boolean;
  premiumUntil: string | null;
  dailyChatLimit: number;
  dailyChatsUsed: number;
  lastResetDate: string; // YYYY-MM-DD
  totalChats: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  isBanned: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  model: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  createdAt: string;
}

export interface Usage {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  requests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
}

export interface Settings {
  defaultModel: string;
  fallbackModels: string[];
  freeDailyLimit: number;
  premiumDailyLimit: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  announcement: string;
  maxMessageLength: number;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  capabilities: string[];
  pricing?: {
    input?: number;
    output?: number;
  };
  visionSupport: boolean;
  isPremiumOnly: boolean;
  isEnabled: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetId?: string;
  details: string;
  createdAt: string;
}
