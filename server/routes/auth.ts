import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { generateToken, requireAuth, AuthRequest, authRateLimiter, adminLoginRateLimiter } from '../middleware/auth.js';
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

// Dedicated Admin Login Endpoint
router.post('/admin-login', adminLoginRateLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const adminSecret = process.env.ADMIN_PASSWORD;
    let isValid = false;

    if (adminSecret) {
      isValid = password === adminSecret;
    } else {
      const defaultAdmin = await db.getUserByEmail('admin@nexusai.com');
      if (defaultAdmin) {
        isValid = await bcrypt.compare(password, defaultAdmin.passwordHash);
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const adminEmail = 'admin@zyricon.ai';
    let adminUser = await db.getUserByEmail(adminEmail) || await db.getUserByEmail('admin@nexusai.com');
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!adminUser) {
      const passwordHash = await bcrypt.hash(password, 10);
      adminUser = {
        id: 'user_admin_primary',
        name: 'Zyricon Administrator',
        email: adminEmail,
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        role: 'ADMIN',
        accountType: 'PREMIUM',
        premium: true,
        premiumUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        dailyChatLimit: 99999,
        dailyChatsUsed: 0,
        lastResetDate: today,
        totalChats: 0,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        isBanned: false,
      };
      await db.createUser(adminUser);
    } else {
      adminUser.role = 'ADMIN';
      adminUser.premium = true;
      adminUser.accountType = 'PREMIUM';
      adminUser.lastLogin = now;
      adminUser.updatedAt = now;
      await db.updateUser(adminUser);
    }

    const token = generateToken(adminUser.id, adminUser.email, 'ADMIN');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeAdmin } = adminUser;
    return res.json({
      token,
      user: safeAdmin,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
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

// Google Login / Sync
router.post('/google', authRateLimiter, async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing Google authentication payload' });
    }

    const settings = await db.getSettings();
    let user = await db.getUserById(uid) || await db.getUserByEmail(email);

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (!user) {
      if (!settings.registrationEnabled) {
        return res.status(403).json({ error: 'User registration is currently disabled by administrator.' });
      }

      user = {
        id: uid,
        name: name || 'Zyricon User',
        email,
        passwordHash: 'GOOGLE_OAUTH_USER',
        avatar: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
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
      await db.createUser(user);
    } else {
      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
      }

      if (user.lastResetDate !== today) {
        user.dailyChatsUsed = 0;
        user.lastResetDate = today;
      }
      user.name = name || user.name;
      user.avatar = photoURL || user.avatar;
      user.lastLogin = now;
      user.updatedAt = now;
      await db.updateUser(user);
    }

    const token = generateToken(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[Google Auth Sync Error]:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google. Please try again.' });
  }
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
