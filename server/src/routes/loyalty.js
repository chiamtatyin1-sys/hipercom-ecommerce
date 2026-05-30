import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  redeemPoints,
  getLoyaltyHistory,
  getLoyaltyBalance,
} from '../services/loyalty.js';

const router = express.Router();

router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await getLoyaltyBalance(req.user.id);
    res.json(balance);
  } catch (error) {
    console.error('Get loyalty balance error:', error);
    res.status(500).json({ error: 'Failed to get loyalty balance' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const history = await getLoyaltyHistory(req.user.id, { page, limit });
    res.json(history);
  } catch (error) {
    console.error('Get loyalty history error:', error);
    res.status(500).json({ error: 'Failed to get loyalty history' });
  }
});

router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Valid points amount required' });
    }

    const result = await redeemPoints(req.user.id, points);

    res.json({
      message: 'Points redeemed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(400).json({ error: error.message || 'Failed to redeem points' });
  }
});

export default router;
