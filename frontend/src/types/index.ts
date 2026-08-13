export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'USER' | 'ADMIN';
  accountType: 'FREE' | 'PREMIUM';
  premium: boolean;
  premiumUntil: string | null;
  dailyChatLimit: number;
  dailyChatsUsed: number;
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

export interface UsageHistoryItem {
  id: string;
  userId: string;
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
}

export interface PlatformSettings {
  freeDailyLimit: number;
  premiumDailyLimit: number;
  announcement: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMessageLength: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalConversations: number;
  totalMessages: number;
  todayRequests: number;
  estimatedCost: number;
  currentModel: string;
  systemStatus: string;
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

export interface AICreditsBalanceInfo {
  balance: number;
  currency: string;
  status: string;
  apiKeyConfigured: boolean;
  endpointUrl: string;
}
