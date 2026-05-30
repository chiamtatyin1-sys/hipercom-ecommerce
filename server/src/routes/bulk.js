import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/bulk-update', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    if (!productIds || !productIds.length) return res.status(400).json({ error: 'Product IDs required' });
    if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ error: 'Updates required' });

    const allowedFields = ['price', 'costPrice', 'stock', 'lowStockAlert', 'isActive', 'isFeatured', 'categoryId', 'brandId', 'warehouseId'];
    const safeUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = key === 'price' || key === 'costPrice' ? parseFloat(value) :
          key === 'stock' || key === 'lowStockAlert' ? parseInt(value) : value;
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: safeUpdates,
    });

    res.json({ message: `${result.count} products updated`, count: result.count });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to bulk update products' });
  }
});

router.post('/bulk-delete', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !productIds.length) return res.status(400).json({ error: 'Product IDs required' });

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isActive: false },
    });

    res.json({ message: `${result.count} products deactivated`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete products' });
  }
});

router.post('/import', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !products.length) return res.status(400).json({ error: 'Products data required' });

    const created = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        if (!p.name || !p.price) {
          errors.push({ row: i + 1, error: 'Name and price required' });
          continue;
        }

        const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const sku = p.sku || `SKU-${Date.now()}-${i}`;

        const product = await prisma.product.create({
          data: {
            name: p.name,
            slug,
            description: p.description || '',
            price: parseFloat(p.price) || 0,
            costPrice: parseFloat(p.costPrice) || 0,
            sku,
            stock: parseInt(p.stock) || 0,
            lowStockAlert: parseInt(p.lowStockAlert) || 10,
            isActive: p.isActive !== 'false',
            isFeatured: p.isFeatured === 'true',
            images: p.images || '[]',
          },
        });
        created.push(product);
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({
      message: `Imported ${created.length} products`,
      created: created.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
});

export default router;
