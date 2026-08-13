import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_ai_super_secret_jwt_key_2026_change_me_in_prod';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: 'USER' | 'ADMIN' };
    
    // Check if user still exists and is not banned
    const user = await db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Check premium expiry on every request
    if (user.premium && user.premiumUntil) {
      const now = new Date();
      const expiry = new Date(user.premiumUntil);
      if (expiry < now) {
        user.premium = false;
        user.accountType = 'FREE';
        user.premiumUntil = null;
        user.dailyChatLimit = (await db.getSettings()).freeDailyLimit;
        await db.updateUser(user);
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrative privilege required.' });
  }
  next();
};

// Rate Limiters
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 admin login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: { error: 'Invalid admin credentials' },
});

export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: { error: 'Chat rate limit exceeded. Please slow down.' },
});
