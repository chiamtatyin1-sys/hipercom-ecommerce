import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const where = { isActive: true };
    if (userId) where.userId = userId;

    const warehouses = await prisma.warehouse.findMany({
      where,
      orderBy: { isDefault: 'desc' },
      include: {
        _count: { select: { products: true } },
        user: userId ? { select: { id: true, username: true } } : undefined,
      },
    });

    res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to get warehouses' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(warehouse);
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Failed to get warehouse' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, address, isDefault } = req.body;

    // Only admins and sellers can create warehouses
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Sellers can only create their own warehouses
    const userId = req.user.role === 'seller' ? req.user.id : null;

    if (isDefault && !userId) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true, userId: userId || undefined },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        userId,
        name,
        address,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, address, isDefault } = req.body;

    // Get the warehouse to check ownership
    const existing = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      // Sellers can only update their own warehouses
      if (existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: {
          isDefault: true,
          userId: existing.userId || undefined,
          id: { not: req.params.id },
        },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: { name, address, isDefault },
    });

    res.json(warehouse);
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Get the warehouse to check ownership
    const existing = await prisma.warehouse.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      // Sellers can only delete their own warehouses
      if (existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await prisma.warehouse.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Warehouse deactivated' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

export default router;