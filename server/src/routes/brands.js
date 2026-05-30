import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to get brands' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where: { isActive: true },
          take: 20,
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Failed to get brand' });
  }
});

router.post('/', authenticate, authorize('admin', 'seller'), upload.single('logo'), async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const logo = req.file ? `/uploads/brands/${req.file.filename}` : null;

    const existing = await prisma.brand.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
      return res.status(400).json({ error: 'Brand name or slug already exists' });
    }

    const brand = await prisma.brand.create({
      data: { name, slug, logo, description },
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'seller'), upload.single('logo'), async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const logo = req.file ? `/uploads/brands/${req.file.filename}` : undefined;

    const data = { name, slug, description };
    if (logo) data.logo = logo;

    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data,
    });

    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.brand.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Brand deactivated' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

export default router;