import { Router } from 'express';
import { fetchModelCatalog } from '../services/aicredits.js';
import { db } from '../db.js';

const router = Router();

// GET /api/models - Returns available models catalog for public users
router.get('/models', async (req, res) => {
  try {
    return res.json({
      models: [
        {
          id: 'zyricon-ai',
          name: 'Zyricon AI',
          provider: 'Zyricon',
          description: 'Advanced multi-modal AI intelligence engine',
          contextWindow: 128000,
          isEnabled: true,
          isPremiumOnly: false,
          visionSupport: true,
        },
      ],
      defaultModel: 'Zyricon AI',
      fallbackModels: [],
    });
  } catch (err) {
    console.error('[GET /api/models Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve available model catalog.' });
  }
});

export default router;
