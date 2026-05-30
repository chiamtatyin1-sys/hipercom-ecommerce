import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a product (public)
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId, isActive: true },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      total: reviews.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Create review (authenticated)
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Product ID and rating (1-5) required' });
    }

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    if (existing) return res.status(400).json({ error: 'You already reviewed this product' });

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating: parseInt(rating),
        comment: comment || '',
      },
      include: { user: { select: { username: true } } },
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review (owner)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { rating, comment } = req.body;
    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...(rating && { rating: parseInt(rating) }),
        ...(comment !== undefined && { comment }),
      },
      include: { user: { select: { username: true } } },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get all reviews (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: { select: { username: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count(),
    ]);
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Toggle review active (admin)
router.put('/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { isActive: !review.isActive },
    });
    res.json(updated);
  } catch (error) {
    console.error('Toggle review error:', error);
    res.status(500).json({ error: 'Failed to toggle review' });
  }
});

export default router;
