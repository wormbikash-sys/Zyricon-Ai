import { Router } from 'express';
import { fetchModelCatalog } from '../services/aicredits.js';
import { db } from '../db.js';

const router = Router();

// GET /api/models - Returns available models catalog
router.get('/models', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const catalog = await fetchModelCatalog(refresh);
    const settings = await db.getSettings();

    const enabledModels = catalog.filter(m => m.isEnabled);

    return res.json({
      models: enabledModels,
      defaultModel: settings.defaultModel,
      fallbackModels: settings.fallbackModels,
    });
  } catch (err) {
    console.error('[GET /api/models Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve available model catalog.' });
  }
});

export default router;
