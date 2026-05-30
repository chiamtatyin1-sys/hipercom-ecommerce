import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getFeatureFlags,
  updateFeatureFlag,
  resetFeatureFlags,
  DEFAULT_FEATURES,
} from '../services/featureFlags.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const flags = await getFeatureFlags(sellerId);

    res.json({
      features: flags,
      defaults: DEFAULT_FEATURES,
    });
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
});

router.put('/:feature', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { feature } = req.params;
    const { isEnabled, config } = req.body;

    if (!DEFAULT_FEATURES.hasOwnProperty(feature)) {
      return res.status(400).json({
        error: 'Invalid feature',
        availableFeatures: Object.keys(DEFAULT_FEATURES),
      });
    }

    const sellerId = req.user.id;
    const flag = await updateFeatureFlag(sellerId, feature, isEnabled, config);

    res.json({
      message: `Feature ${feature} ${isEnabled ? 'enabled' : 'disabled'}`,
      flag,
    });
  } catch (error) {
    console.error('Update feature flag error:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

router.post('/reset', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const sellerId = req.user.id;
    await resetFeatureFlags(sellerId);

    res.json({ message: 'Feature flags reset to defaults' });
  } catch (error) {
    console.error('Reset feature flags error:', error);
    res.status(500).json({ error: 'Failed to reset feature flags' });
  }
});

router.get('/defaults', authenticate, async (req, res) => {
  try {
    res.json({ defaults: DEFAULT_FEATURES });
  } catch (error) {
    console.error('Get defaults error:', error);
    res.status(500).json({ error: 'Failed to get defaults' });
  }
});

export default router;
