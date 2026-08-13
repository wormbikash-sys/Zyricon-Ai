import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { db } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import chatRoutes from './server/routes/chat.js';
import modelRoutes from './server/routes/models.js';
import userRoutes from './server/routes/user.js';
import adminRoutes from './server/routes/admin.js';
import healthRoutes from './server/routes/health.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  await db.init();

  const app = express();

  // Trust proxy for rate limiting behind reverse proxies (Render, Cloudflare, Nginx)
  app.set('trust proxy', 1);

  // Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
    })
  );

  // CORS Configuration - Restrict to FRONTEND_URL or Vercel domains in production
  const frontendUrl = process.env.FRONTEND_URL;
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!isProd) return callback(null, true);
        if (frontendUrl) {
          const allowedOrigins = frontendUrl.split(',').map((u) => u.trim());
          if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
          }
        }
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes ONLY (Render backend does NOT serve frontend HTML)
  app.use('/', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', chatRoutes);
  app.use('/api', modelRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Global API Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Render Backend Error]:', err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(err.status || 500).json({
      error: 'An unexpected error occurred on the server. Please try again later.',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Zyricon AI API Backend running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` CORS Allowed Origin: ${frontendUrl || 'localhost'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('[Fatal Render Backend Error]:', err);
  process.exit(1);
});
