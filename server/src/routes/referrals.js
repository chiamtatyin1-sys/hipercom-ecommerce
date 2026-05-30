import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', authenticate, async (req, res) => {
  try {
    let config = await prisma.referralConfig.findUnique({
      where: { sellerId: req.user.id },
    });

    if (!config && req.user.role === 'seller') {
      // Create default config for new sellers
      config = await prisma.referralConfig.create({
        data: {
          sellerId: req.user.id,
          referrerRewardType: 'percentage',
          referrerRewardValue: 5,
          refereeDiscountType: 'percentage',
          refereeDiscountValue: 10,
          minOrderAmount: 0,
          maxUses: 0,
          isActive: true,
        },
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Get referral config error:', error);
    res.status(500).json({ error: 'Failed to get referral config' });
  }
});

router.put('/config', authenticate, authorize('seller', 'admin'), async (req, res) => {
  try {
    const {
      referrerRewardType,
      referrerRewardValue,
      refereeDiscountType,
      refereeDiscountValue,
      minOrderAmount,
      maxUses,
      isActive,
    } = req.body;

    const config = await prisma.referralConfig.upsert({
      where: { sellerId: req.user.id },
      update: {
        referrerRewardType,
        referrerRewardValue,
        refereeDiscountType,
        refereeDiscountValue,
        minOrderAmount,
        maxUses,
        isActive,
      },
      create: {
        sellerId: req.user.id,
        referrerRewardType,
        referrerRewardValue,
        refereeDiscountType,
        refereeDiscountValue,
        minOrderAmount,
        maxUses,
        isActive,
      },
    });

    res.json(config);
  } catch (error) {
    console.error('Update referral config error:', error);
    res.status(500).json({ error: 'Failed to update referral config' });
  }
});

router.get('/my-referrals', authenticate, async (req, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        referee: { select: { username: true, email: true } },
        order: { select: { orderNumber: true, total: true, createdAt: true } },
      },
    });

    const stats = {
      totalReferrals: referrals.length,
      successfulReferrals: referrals.filter(r => r.status === 'earned').length,
      totalEarnings: referrals.reduce((sum, r) => sum + r.commissionAmount, 0),
    };

    res.json({ referrals, stats });
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { username: true, email: true } },
          referee: { select: { username: true, email: true } },
          order: { select: { orderNumber: true, total: true } },
        },
      }),
      prisma.referral.count({ where }),
    ]);

    res.json({
      referrals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, wallet: true },
      });

      if (!user || user.wallet < amount) {
        throw new Error('Insufficient balance');
      }

      await tx.user.update({
        where: { id: req.user.id },
        data: { wallet: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          type: 'expense',
          category: 'withdrawal',
          amount,
          description: `Wallet withdrawal by ${user.username}`,
        },
      });

      return user.wallet - amount;
    });

    res.json({ message: 'Withdrawal processed', newBalance: result });
  } catch (error) {
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

export default router;