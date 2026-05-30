import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { page = 1, limit = 50, isRead } = req.query;
    const where = {};
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.stockAlert.count({ where }),
    ]);

    res.json({
      alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Stock alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stock alerts' });
  }
});

router.post('/mark-read/:id', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const alert = await prisma.stockAlert.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(alert);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.post('/mark-all-read', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const result = await prisma.stockAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ message: `${result.count} alerts marked as read` });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.get('/unread-count', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const count = await prisma.stockAlert.count({ where: { isRead: false } });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export async function checkLowStockAndAlert() {
  try {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields.lowStockAlert },
        isActive: true,
      },
    });

    for (const product of lowStockProducts) {
      const existingAlert = await prisma.stockAlert.findFirst({
        where: {
          productId: product.id,
          isRead: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingAlert) {
        await prisma.stockAlert.create({
          data: {
            productId: product.id,
            message: `Low stock alert: "${product.name}" has ${product.stock} units remaining (threshold: ${product.lowStockAlert})`,
          },
        });

        const emailEnabled = process.env.EMAIL_HOST && process.env.EMAIL_USER;
        if (emailEnabled) {
          try {
            await sendEmail({
              to: process.env.EMAIL_USER,
              subject: `Low Stock Alert: ${product.name}`,
              text: `Product "${product.name}" (SKU: ${product.sku}) has reached low stock level.\nCurrent stock: ${product.stock}\nAlert threshold: ${product.lowStockAlert}\n\nPlease restock soon.`,
            });
          } catch (emailError) {
            console.error('Failed to send low stock email:', emailError);
          }
        }
      }
    }

    return lowStockProducts.length;
  } catch (error) {
    console.error('Low stock check error:', error);
    return 0;
  }
}

export default router;
