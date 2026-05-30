import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'All fields required with valid quantity' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination must be different' });
    }

    const fromStock = await prisma.productStock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
      include: { product: true, warehouse: true },
    });

    if (!fromStock || fromStock.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock in source warehouse' });
    }

    const toWarehouse = await prisma.warehouse.findUnique({ where: { id: toWarehouseId } });
    if (!toWarehouse) {
      return res.status(404).json({ error: 'Destination warehouse not found' });
    }

    const transfer = await prisma.$transaction(async (tx) => {
      await tx.productStock.update({
        where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
        data: { quantity: { decrement: quantity } },
      });

      await tx.productStock.upsert({
        where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
        update: { quantity: { increment: quantity } },
        create: { productId, warehouseId: toWarehouseId, quantity },
      });

      return tx.stockTransfer.create({
        data: {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity,
          notes: notes || '',
          userId: req.user.id,
        },
        include: {
          product: { select: { name: true } },
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } },
        },
      });
    });

    res.status(201).json(transfer);
  } catch (error) {
    console.error('Stock transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer stock' });
  }
});

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: {
        product: { select: { name: true } },
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to get transfers' });
  }
});

export default router;
