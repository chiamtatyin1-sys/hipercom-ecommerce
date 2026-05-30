import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    const where = {};
    if (productId) where.productId = productId;

    const variants = await prisma.productVariant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(variants);
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: 'Failed to get variants' });
  }
});

router.post('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { productId, variantName, variantValue, additionalPrice, sku, stock, isActive } = req.body;

    if (!productId || !variantName || !variantValue || !sku) {
      return res.status(400).json({ error: 'Product ID, variant name, value, and SKU required' });
    }

    const existing = await prisma.productVariant.findUnique({ where: { sku } });
    if (existing) return res.status(400).json({ error: 'SKU already exists' });

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        variantName,
        variantValue,
        additionalPrice: parseFloat(additionalPrice) || 0,
        sku,
        stock: parseInt(stock) || 0,
        isActive: isActive !== false,
      },
    });

    res.json(variant);
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Failed to create variant' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { variantName, variantValue, additionalPrice, sku, stock, isActive } = req.body;

    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: {
        variantName,
        variantValue,
        additionalPrice: parseFloat(additionalPrice),
        sku,
        stock: parseInt(stock),
        isActive,
      },
    });

    res.json(variant);
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.productVariant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Variant deleted' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

export default router;
