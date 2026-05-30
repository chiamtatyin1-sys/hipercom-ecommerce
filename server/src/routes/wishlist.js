import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            brand: { select: { name: true, logo: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    if (existing) return res.status(400).json({ error: 'Already in wishlist' });

    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, productId },
      include: { product: { include: { brand: true } } },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

router.get('/check/:productId', authenticate, async (req, res) => {
  try {
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    });
    res.json({ inWishlist: !!item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default router;
