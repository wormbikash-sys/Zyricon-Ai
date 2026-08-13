import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// /health
router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

// /api/health
router.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    // Test DB connection
    const settings = await db.getSettings();
    const dbLatencyMs = Date.now() - startTime;

    return res.json({
      status: 'ok',
      service: 'NexusAI Backend API',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      aiGateway: {
        provider: 'AICredits API',
        configured: Boolean(process.env.AICREDITS_API_KEY),
        defaultModel: settings.defaultModel,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'degraded',
      error: (err as Error).message,
    });
  }
});

export default router;
