import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    const stocks = await prisma.productStock.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(stocks);
  } catch (error) {
    console.error('Get product stocks error:', error);
    res.status(500).json({ error: 'Failed to get product stocks' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    if (!productId || !warehouseId) {
      return res.status(400).json({ error: 'Product ID and warehouse ID required' });
    }

    const stock = await prisma.productStock.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
      update: { quantity: parseInt(quantity) },
      create: {
        productId,
        warehouseId,
        quantity: parseInt(quantity) || 0,
      },
    });

    res.json(stock);
  } catch (error) {
    console.error('Create product stock error:', error);
    res.status(500).json({ error: 'Failed to create product stock' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { quantity } = req.body;

    const stock = await prisma.productStock.update({
      where: { id: req.params.id },
      data: { quantity: parseInt(quantity) },
    });

    res.json(stock);
  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({ error: 'Failed to update product stock' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.productStock.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product stock deleted' });
  } catch (error) {
    console.error('Delete product stock error:', error);
    res.status(500).json({ error: 'Failed to delete product stock' });
  }
});

export default router;
