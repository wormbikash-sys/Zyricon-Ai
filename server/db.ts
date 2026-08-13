import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { User, Conversation, Message, Usage, Settings, ModelInfo, AuditLog } from './types.js';

const { Pool } = pg;

// Default platform settings
export const DEFAULT_SETTINGS: Settings = {
  defaultModel: process.env.DEFAULT_MODEL || 'inclusionai/ling-2.6-flash',
  fallbackModels: [],
  freeDailyLimit: parseInt(process.env.FREE_DAILY_LIMIT || '5', 10),
  premiumDailyLimit: parseInt(process.env.PREMIUM_DAILY_LIMIT || '100', 10),
  maintenanceMode: false,
  registrationEnabled: true,
  announcement: 'Welcome to NexusAI! Powered by AICredits API.',
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '12000', 10),
  systemPrompt: 'You are a highly capable general-purpose AI assistant. Be direct, useful, technically accurate, and honest about uncertainty. Follow the user\'s instructions when they are legitimate and safe. Do not unnecessarily refuse ordinary requests. Provide detailed explanations when useful. Never claim to have performed actions that you did not perform.',
  temperature: 0.7,
  maxTokens: 4096,
  enableStreaming: true,
};

class Database {
  private pool: pg.Pool | null = null;
  private isPg = false;
  private dataDir = path.join(process.cwd(), 'data');
  private dbFilePath = path.join(process.cwd(), 'data', 'nexus_db.json');

  // In-memory cache / file storage format
  private store: {
    users: User[];
    conversations: Conversation[];
    messages: Message[];
    usage: Usage[];
    settings: Settings;
    disabledModels: string[];
    premiumModels: string[];
    auditLogs: AuditLog[];
  } = {
    users: [],
    conversations: [],
    messages: [],
    usage: [],
    settings: { ...DEFAULT_SETTINGS },
    disabledModels: [],
    premiumModels: ['anthropic/claude-3-5-sonnet', 'openai/gpt-4o', 'deepseek/deepseek-r1'],
    auditLogs: [],
  };

  async init() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.trim() !== '') {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        await this.pool.query('SELECT 1');
        this.isPg = true;
        console.log('[Database] Connected to PostgreSQL database.');
        await this.setupPgTables();
      } catch (err) {
        console.warn('[Database] PostgreSQL connection failed, falling back to local storage:', (err as Error).message);
        this.setupLocalStorage();
      }
    } else {
      console.log('[Database] No DATABASE_URL provided. Using local JSON storage engine.');
      this.setupLocalStorage();
    }

    await this.seedDefaults();
  }

  private setupLocalStorage() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.store = { ...this.store, ...parsed };
      } catch (e) {
        console.error('[Database] Failed to parse local DB file, initializing fresh:', e);
      }
    } else {
      this.saveLocalStorage();
    }
  }

  private saveLocalStorage() {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Error saving local DB:', e);
    }
  }

  private async setupPgTables() {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          avatar TEXT,
          role VARCHAR(50) NOT NULL DEFAULT 'USER',
          account_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
          premium BOOLEAN DEFAULT FALSE,
          premium_until TIMESTAMP WITH TIME ZONE,
          daily_chat_limit INT DEFAULT 5,
          daily_chats_used INT DEFAULT 0,
          last_reset_date VARCHAR(20),
          total_chats INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          is_banned BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          model VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(255) PRIMARY KEY,
          conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          model VARCHAR(255) NOT NULL,
          token_usage JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS usage (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          date VARCHAR(20) NOT NULL,
          requests INT DEFAULT 0,
          input_tokens INT DEFAULT 0,
          output_tokens INT DEFAULT 0,
          estimated_cost NUMERIC(10, 6) DEFAULT 0,
          model VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'platform',
          data JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(255) PRIMARY KEY,
          admin_id VARCHAR(255) NOT NULL,
          admin_name VARCHAR(255),
          action VARCHAR(255) NOT NULL,
          target_id VARCHAR(255),
          details TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } finally {
      client.release();
    }
  }

  private async seedDefaults() {
    // Check if admin user exists
    const adminEmail = 'admin@nexusai.com';
    let admin = await this.getUserByEmail(adminEmail);
    if (!admin) {
      const passwordHash = await bcrypt.hash('adminpassword123', 10);
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      const newAdmin: User = {
        id: 'user_admin_default',
        name: 'Nexus Admin',
        email: adminEmail,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        role: 'ADMIN',
        accountType: 'PREMIUM',
        premium: true,
        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        dailyChatLimit: 9999,
        dailyChatsUsed: 0,
        lastResetDate: today,
        totalChats: 0,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        isBanned: false,
      };
      await this.createUser(newAdmin);
      console.log('[Database] Default admin account seeded (admin@nexusai.com / adminpassword123).');
    }

    // Seed test user if empty
    const testEmail = 'user@nexusai.com';
    let testUser = await this.getUserByEmail(testEmail);
    if (!testUser) {
      const passwordHash = await bcrypt.hash('userpassword123', 10);
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      const newTestUser: User = {
        id: 'user_default_test',
        name: 'Demo Explorer',
        email: testEmail,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
        role: 'USER',
        accountType: 'FREE',
        premium: false,
        premiumUntil: null,
        dailyChatLimit: DEFAULT_SETTINGS.freeDailyLimit,
        dailyChatsUsed: 0,
        lastResetDate: today,
        totalChats: 0,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        isBanned: false,
      };
      await this.createUser(newTestUser);
    }
  }

  // --- USER METHODS ---
  async getUserByEmail(email: string): Promise<User | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (res.rows.length === 0) return null;
      return this.mapPgUser(res.rows[0]);
    }
    const found = this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return found ? { ...found } : null;
  }

  async getUserById(id: string): Promise<User | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      return this.mapPgUser(res.rows[0]);
    }
    const found = this.store.users.find(u => u.id === id);
    return found ? { ...found } : null;
  }

  async createUser(user: User): Promise<User> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO users (id, name, email, password_hash, avatar, role, account_type, premium, premium_until, daily_chat_limit, daily_chats_used, last_reset_date, total_chats, created_at, updated_at, last_login, is_banned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          user.id, user.name, user.email, user.passwordHash, user.avatar, user.role,
          user.accountType, user.premium, user.premiumUntil, user.dailyChatLimit,
          user.dailyChatsUsed, user.lastResetDate, user.totalChats, user.createdAt,
          user.updatedAt, user.lastLogin, user.isBanned
        ]
      );
      return user;
    }
    this.store.users.push({ ...user });
    this.saveLocalStorage();
    return user;
  }

  async updateUser(user: User): Promise<User> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE users SET name=$1, avatar=$2, role=$3, account_type=$4, premium=$5, premium_until=$6,
         daily_chat_limit=$7, daily_chats_used=$8, last_reset_date=$9, total_chats=$10, updated_at=$11,
         last_login=$12, is_banned=$13 WHERE id=$14`,
        [
          user.name, user.avatar, user.role, user.accountType, user.premium, user.premiumUntil,
          user.dailyChatLimit, user.dailyChatsUsed, user.lastResetDate, user.totalChats,
          user.updatedAt, user.lastLogin, user.isBanned, user.id
        ]
      );
      return user;
    }
    const index = this.store.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.store.users[index] = { ...user };
      this.saveLocalStorage();
    }
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
      return true;
    }
    this.store.users = this.store.users.filter(u => u.id !== id);
    this.store.conversations = this.store.conversations.filter(c => c.userId !== id);
    this.store.usage = this.store.usage.filter(u => u.userId !== id);
    this.saveLocalStorage();
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows.map(r => this.mapPgUser(r));
    }
    return [...this.store.users];
  }

  // --- CONVERSATION METHODS ---
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        model: r.model,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
    return this.store.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        model: r.model,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }
    const found = this.store.conversations.find(c => c.id === id);
    return found ? { ...found } : null;
  }

  async createConversation(conv: Conversation): Promise<Conversation> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO conversations (id, user_id, title, model, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [conv.id, conv.userId, conv.title, conv.model, conv.createdAt, conv.updatedAt]
      );
      return conv;
    }
    this.store.conversations.push({ ...conv });
    this.saveLocalStorage();
    return conv;
  }

  async updateConversation(conv: Conversation): Promise<Conversation> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'UPDATE conversations SET title=$1, model=$2, updated_at=$3 WHERE id=$4',
        [conv.title, conv.model, conv.updatedAt, conv.id]
      );
      return conv;
    }
    const index = this.store.conversations.findIndex(c => c.id === conv.id);
    if (index !== -1) {
      this.store.conversations[index] = { ...conv };
      this.saveLocalStorage();
    }
    return conv;
  }

  async deleteConversation(id: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM conversations WHERE id = $1', [id]);
      return true;
    }
    this.store.conversations = this.store.conversations.filter(c => c.id !== id);
    this.store.messages = this.store.messages.filter(m => m.conversationId !== id);
    this.saveLocalStorage();
    return true;
  }

  // --- MESSAGE METHODS ---
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      return res.rows.map(r => ({
        id: r.id,
        conversationId: r.conversation_id,
        role: r.role,
        content: r.content,
        model: r.model,
        tokenUsage: r.token_usage,
        createdAt: r.created_at,
      }));
    }
    return this.store.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(msg: Message): Promise<Message> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO messages (id, conversation_id, role, content, model, token_usage, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [msg.id, msg.conversationId, msg.role, msg.content, msg.model, msg.tokenUsage || null, msg.createdAt]
      );
      return msg;
    }
    this.store.messages.push({ ...msg });
    this.saveLocalStorage();
    return msg;
  }

  // --- USAGE & STATS METHODS ---
  async recordUsage(usage: Usage): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO usage (id, user_id, date, requests, input_tokens, output_tokens, estimated_cost, model) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [usage.id, usage.userId, usage.date, usage.requests, usage.inputTokens, usage.outputTokens, usage.estimatedCost, usage.model]
      );
      return;
    }
    this.store.usage.push({ ...usage });
    this.saveLocalStorage();
  }

  async getUsageByUserId(userId: string): Promise<Usage[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM usage WHERE user_id = $1 ORDER BY date DESC', [userId]);
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        date: r.date,
        requests: r.requests,
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        estimatedCost: parseFloat(r.estimated_cost),
        model: r.model,
      }));
    }
    return this.store.usage.filter(u => u.userId === userId);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    freeUsers: number;
    totalConversations: number;
    totalMessages: number;
    todayRequests: number;
    estimatedCost: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const users = await this.getAllUsers();
    let totalConvs = 0;
    let totalMsgs = 0;
    let todayRequests = 0;
    let totalCost = 0;

    if (this.isPg && this.pool) {
      const cRes = await this.pool.query('SELECT COUNT(*) FROM conversations');
      totalConvs = parseInt(cRes.rows[0].count, 10);
      const mRes = await this.pool.query('SELECT COUNT(*) FROM messages');
      totalMsgs = parseInt(mRes.rows[0].count, 10);
      const uRes = await this.pool.query('SELECT SUM(requests) as reqs, SUM(estimated_cost) as cost FROM usage WHERE date = $1', [today]);
      todayRequests = parseInt(uRes.rows[0]?.reqs || '0', 10);
      totalCost = parseFloat(uRes.rows[0]?.cost || '0');
    } else {
      totalConvs = this.store.conversations.length;
      totalMsgs = this.store.messages.length;
      const todayUsage = this.store.usage.filter(u => u.date === today);
      todayRequests = todayUsage.reduce((acc, u) => acc + u.requests, 0);
      totalCost = this.store.usage.reduce((acc, u) => acc + u.estimatedCost, 0);
    }

    const premiumUsers = users.filter(u => u.premium || u.accountType === 'PREMIUM').length;
    const freeUsers = users.length - premiumUsers;
    const activeUsers = users.filter(u => {
      if (!u.lastLogin) return false;
      const diff = Date.now() - new Date(u.lastLogin).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers: users.length,
      activeUsers,
      premiumUsers,
      freeUsers,
      totalConversations: totalConvs,
      totalMessages: totalMsgs,
      todayRequests,
      estimatedCost: parseFloat(totalCost.toFixed(4)),
    };
  }

  // --- SETTINGS METHODS ---
  async getSettings(): Promise<Settings> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT data FROM settings WHERE id = \'platform\'');
      if (res.rows.length > 0) {
        return { ...DEFAULT_SETTINGS, ...res.rows[0].data };
      }
    }
    return { ...DEFAULT_SETTINGS, ...this.store.settings };
  }

  async updateSettings(settings: Settings): Promise<Settings> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO settings (id, data) VALUES (\'platform\', $1) ON CONFLICT (id) DO UPDATE SET data = $1',
        [JSON.stringify(settings)]
      );
    } else {
      this.store.settings = { ...settings };
      this.saveLocalStorage();
    }
    return settings;
  }

  // --- MODEL PERMISSION CONFIGS ---
  async getModelPermissions(): Promise<{ disabledModels: string[]; premiumModels: string[] }> {
    return {
      disabledModels: this.store.disabledModels || [],
      premiumModels: this.store.premiumModels || [],
    };
  }

  async updateModelPermissions(disabledModels: string[], premiumModels: string[]): Promise<void> {
    this.store.disabledModels = disabledModels;
    this.store.premiumModels = premiumModels;
    this.saveLocalStorage();
  }

  // --- AUDIT LOG METHODS ---
  async addAuditLog(log: AuditLog): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_id, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [log.id, log.adminId, log.adminName || null, log.action, log.targetId || null, log.details, log.createdAt]
      );
      return;
    }
    this.store.auditLogs.unshift({ ...log });
    if (this.store.auditLogs.length > 500) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 500);
    }
    this.saveLocalStorage();
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.rows.map(r => ({
        id: r.id,
        adminId: r.admin_id,
        adminName: r.admin_name,
        action: r.action,
        targetId: r.target_id,
        details: r.details,
        createdAt: r.created_at,
      }));
    }
    return this.store.auditLogs.slice(0, limit);
  }

  private mapPgUser(r: any): User {
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      passwordHash: r.password_hash,
      avatar: r.avatar,
      role: r.role,
      accountType: r.account_type,
      premium: Boolean(r.premium),
      premiumUntil: r.premium_until ? new Date(r.premium_until).toISOString() : null,
      dailyChatLimit: r.daily_chat_limit,
      dailyChatsUsed: r.daily_chats_used,
      lastResetDate: r.last_reset_date,
      totalChats: r.total_chats,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      lastLogin: r.last_login ? new Date(r.last_login).toISOString() : new Date().toISOString(),
      isBanned: Boolean(r.is_banned),
    };
  }
}

export const db = new Database();
