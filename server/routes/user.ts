import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/user/profile
router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// GET /api/user/usage
router.get('/usage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const usageList = await db.getUsageByUserId(userId);
    const user = await db.getUserById(userId);
    const settings = await db.getSettings();

    const limit = user?.premium ? settings.premiumDailyLimit : settings.freeDailyLimit;

    return res.json({
      dailyChatsUsed: user?.dailyChatsUsed || 0,
      dailyChatLimit: limit,
      totalChats: user?.totalChats || 0,
      usageHistory: usageList,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user usage stats.' });
  }
});

// GET /api/user/settings - Public platform info (announcement, daily limits)
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    return res.json({
      freeDailyLimit: settings.freeDailyLimit,
      premiumDailyLimit: settings.premiumDailyLimit,
      announcement: settings.announcement,
      maintenanceMode: settings.maintenanceMode,
      registrationEnabled: settings.registrationEnabled,
      maxMessageLength: settings.maxMessageLength,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve system settings.' });
  }
});

// POST /api/user/upgrade - Simulate upgrading user to Premium
router.post('/upgrade', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const settings = await db.getSettings();
    user.premium = true;
    user.accountType = 'PREMIUM';
    // Grant 30 days of premium
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    user.premiumUntil = new Date(Date.now() + thirtyDays).toISOString();
    user.dailyChatLimit = settings.premiumDailyLimit;
    user.updatedAt = new Date().toISOString();

    await db.updateUser(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      message: 'Successfully upgraded to Premium Membership!',
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process upgrade.' });
  }
});

// DELETE /api/user/account - Delete user account permanently
router.delete('/account', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await db.deleteUser(userId);
    res.clearCookie('token');
    return res.json({ message: 'Account permanently deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

export default router;
