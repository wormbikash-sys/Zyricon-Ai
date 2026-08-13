import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import chatRoutes from './server/routes/chat.js';
import modelRoutes from './server/routes/models.js';
import userRoutes from './server/routes/user.js';
import adminRoutes from './server/routes/admin.js';
import healthRoutes from './server/routes/health.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  await db.init();

  const app = express();

  // Trust proxy for rate limiting behind reverse proxies (Nginx / Cloud Run)
  app.set('trust proxy', 1);

  // Helmet with relaxed frame options for preview iframe compatibility
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
    })
  );

  // CORS Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.use(
    cors({
      origin: isProd ? [frontendUrl, 'https://*.vercel.app'] : true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', chatRoutes);
  app.use('/api', modelRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);

  // Global API error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Global Error]:', err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(err.status || 500).json({
      error: err.message || 'An unexpected error occurred on the server.',
    });
  });

  // Vite Dev Server Middleware or Static Production File Serving
  if (!isProd) {
    console.log('[Server] Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Production mode: Serving static files from dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` NexusAI Server listening on http://0.0.0.0:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Default Admin: admin@nexusai.com / adminpassword123`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
