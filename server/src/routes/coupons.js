import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

console.log('✅ Coupon routes loaded');

// Validate coupon (public - used during checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required' });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });

    const now = new Date();
    if (!coupon.isActive) return res.status(400).json({ error: 'Coupon is not active' });
    if (coupon.startDate && new Date(coupon.startDate) > now) return res.status(400).json({ error: 'Coupon not yet valid' });
    if (coupon.endDate && new Date(coupon.endDate) < now) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ error: `Minimum order amount: RM ${coupon.minOrderAmount.toFixed(2)}` });

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = orderAmount * (coupon.discountValue / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: parseFloat(discount.toFixed(2)),
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Get all coupons (admin)
router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

// Create coupon (admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate, isActive, applicableTo, applicableIds } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType: discountType || 'percentage',
        discountValue: parseFloat(discountValue) || 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: parseInt(usageLimit) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        applicableTo: applicableTo || 'all',
        applicableIds: applicableIds ? JSON.stringify(applicableIds) : '[]',
      },
    });
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update coupon (admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, startDate, endDate, isActive, applicableTo, applicableIds } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        description,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : undefined,
        maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount) : undefined,
        usageLimit: usageLimit !== undefined ? parseInt(usageLimit) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        applicableTo,
        applicableIds: applicableIds ? JSON.stringify(applicableIds) : undefined,
      },
    });
    res.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete coupon (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

export default router;
