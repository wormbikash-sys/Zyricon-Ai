import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { fetchModelCatalog, fetchAICreditsBalance } from '../services/aicredits.js';
import { AuditLog } from '../types.js';

const router = Router();

// Middleware: All admin routes require Auth + Admin
router.use(requireAuth, requireAdmin);

// Helper to log audit events
async function audit(req: AuthRequest, action: string, targetId?: string, details?: string) {
  const log: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    adminId: req.user!.id,
    adminName: req.user!.email,
    action,
    targetId,
    details: details || '',
    createdAt: new Date().toISOString(),
  };
  await db.addAuditLog(log);
}

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    const settings = await db.getSettings();
    return res.json({
      ...stats,
      currentModel: settings.defaultModel,
      systemStatus: settings.maintenanceMode ? 'Maintenance Mode' : 'Operational',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    return res.json({ users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// PATCH /api/admin/users/:id - Manage user
router.patch('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, isBanned, premium, accountType, dailyChatLimit, resetDailyUsage, extendPremiumDays } = req.body;

    const user = await db.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const changes: string[] = [];

    if (role && (role === 'USER' || role === 'ADMIN')) {
      user.role = role;
      changes.push(`Role changed to ${role}`);
    }

    if (typeof isBanned === 'boolean') {
      user.isBanned = isBanned;
      changes.push(isBanned ? 'User Banned' : 'User Unbanned');
    }

    if (typeof premium === 'boolean') {
      user.premium = premium;
      user.accountType = premium ? 'PREMIUM' : 'FREE';
      if (premium) {
        const days = extendPremiumDays || 30;
        user.premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        changes.push(`Granted Premium for ${days} days`);
      } else {
        user.premiumUntil = null;
        changes.push('Removed Premium membership');
      }
    }

    if (accountType && (accountType === 'FREE' || accountType === 'PREMIUM')) {
      user.accountType = accountType;
      user.premium = accountType === 'PREMIUM';
      changes.push(`Account type updated to ${accountType}`);
    }

    if (typeof dailyChatLimit === 'number' && dailyChatLimit >= 0) {
      user.dailyChatLimit = dailyChatLimit;
      changes.push(`Daily limit set to ${dailyChatLimit}`);
    }

    if (resetDailyUsage) {
      user.dailyChatsUsed = 0;
      changes.push('Reset daily chats used to 0');
    }

    user.updatedAt = new Date().toISOString();
    await db.updateUser(user);

    await audit(req, 'USER_UPDATE', user.id, changes.join('; '));

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, message: 'User updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    const user = await db.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await db.deleteUser(id);
    await audit(req, 'USER_DELETE', id, `Deleted user ${user.email}`);

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// GET /api/admin/models - Get complete model list and permission configs
router.get('/models', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const catalog = await fetchModelCatalog(refresh);
    const permissions = await db.getModelPermissions();
    return res.json({
      catalog,
      disabledModels: permissions.disabledModels,
      premiumModels: permissions.premiumModels,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin models.' });
  }
});

// POST /api/admin/models/permissions - Update model permissions
router.post('/models/permissions', async (req: AuthRequest, res) => {
  try {
    const { disabledModels, premiumModels } = req.body;
    if (!Array.isArray(disabledModels) || !Array.isArray(premiumModels)) {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    await db.updateModelPermissions(disabledModels, premiumModels);
    await audit(req, 'MODEL_PERMISSIONS_UPDATE', undefined, `Disabled: ${disabledModels.length}, Premium: ${premiumModels.length}`);

    return res.json({ message: 'Model configuration saved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save model permissions.' });
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// POST /api/admin/settings
router.post('/settings', async (req: AuthRequest, res) => {
  try {
    const newSettings = req.body;
    const currentSettings = await db.getSettings();
    const updated = { ...currentSettings, ...newSettings };

    await db.updateSettings(updated);
    await audit(req, 'SETTINGS_UPDATE', undefined, 'Platform settings updated');

    return res.json({ settings: updated, message: 'Settings saved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// GET /api/admin/system-prompt
router.get('/system-prompt', async (req, res) => {
  try {
    const settings = await db.getSettings();
    return res.json({
      systemPrompt: settings.systemPrompt,
      defaultModel: settings.defaultModel,
      fallbackModels: settings.fallbackModels,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      enableStreaming: settings.enableStreaming,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch system prompt settings.' });
  }
});

// POST & PUT /api/admin/system-prompt
const handleSaveSystemPrompt = async (req: AuthRequest, res: any) => {
  try {
    const { systemPrompt, defaultModel, fallbackModels, temperature, maxTokens, enableStreaming } = req.body;

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return res.status(400).json({ error: 'System prompt cannot be empty.' });
    }

    const currentSettings = await db.getSettings();
    const updated = {
      ...currentSettings,
      systemPrompt,
      defaultModel: defaultModel || currentSettings.defaultModel,
      fallbackModels: Array.isArray(fallbackModels) ? fallbackModels : currentSettings.fallbackModels,
      temperature: typeof temperature === 'number' ? temperature : currentSettings.temperature,
      maxTokens: typeof maxTokens === 'number' ? maxTokens : currentSettings.maxTokens,
      enableStreaming: typeof enableStreaming === 'boolean' ? enableStreaming : currentSettings.enableStreaming,
    };

    await db.updateSettings(updated);
    await audit(req, 'SYSTEM_PROMPT_UPDATE', undefined, `Updated system prompt (${systemPrompt.length} chars)`);

    return res.json({ message: 'AI System Prompt updated successfully.', settings: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update system prompt.' });
  }
};

router.post('/system-prompt', handleSaveSystemPrompt);
router.put('/system-prompt', handleSaveSystemPrompt);

// GET /api/admin/aicredits/balance
router.get('/aicredits/balance', async (req, res) => {
  try {
    const balanceInfo = await fetchAICreditsBalance();
    return res.json({
      ...balanceInfo,
      apiKeyConfigured: Boolean(process.env.AICREDITS_API_KEY || process.env.GEMINI_API_KEY),
      endpointUrl: process.env.AICREDITS_BASE_URL || 'https://api.aicredits.in/v1',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch AICredits wallet balance.' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.getAuditLogs();
    return res.json({ auditLogs: logs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

export default router;
