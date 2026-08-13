import { Router } from 'express';

const router = Router();

// GET /health
router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

// GET /api/health
router.get('/api/health', (req, res) => {
  return res.json({ status: 'ok' });
});

export default router;
