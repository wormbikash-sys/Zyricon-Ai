import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { generateToken, requireAuth, AuthRequest, authRateLimiter } from '../middleware/auth.js';
import { User } from '../types.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const settings = await db.getSettings();
    if (!settings.registrationEnabled) {
      return res.status(403).json({ error: 'User registration is currently disabled by the administrator.' });
    }

    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid input data' });
    }

    const { name, email, password } = validation.data;

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: User = {
      id: userId,
      name,
      email,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      role: 'USER',
      accountType: 'FREE',
      premium: false,
      premiumUntil: null,
      dailyChatLimit: settings.freeDailyLimit,
      dailyChatsUsed: 0,
      lastResetDate: today,
      totalChats: 0,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      isBanned: false,
    };

    await db.createUser(newUser);
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid input data' });
    }

    const { email, password } = validation.data;

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset daily usage if new day
    const today = new Date().toISOString().split('T')[0];
    if (user.lastResetDate !== today) {
      user.dailyChatsUsed = 0;
      user.lastResetDate = today;
    }

    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await db.updateUser(user);

    const token = generateToken(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});

// Me
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Reset daily usage if new day
    const today = new Date().toISOString().split('T')[0];
    if (user.lastResetDate !== today) {
      user.dailyChatsUsed = 0;
      user.lastResetDate = today;
      await db.updateUser(user);
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

export default router;
