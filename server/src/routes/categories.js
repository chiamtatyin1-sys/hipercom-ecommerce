import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

router.get('/tree', async (req, res) => {
  try {
    const rootCategories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });

    res.json(rootCategories);
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ error: 'Failed to get category tree' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        children: { where: { isActive: true } },
        products: { where: { isActive: true }, take: 20 },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

router.post('/', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { name, slug, icon, parentId } = req.body;

    const existing = await prisma.category.findFirst({
      where: { slug },
    });

    if (existing) {
      return res.status(400).json({ error: 'Category slug already exists' });
    }

    const category = await prisma.category.create({
      data: { name, slug, icon, parentId: parentId || null },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { name, slug, icon, parentId } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, icon, parentId: parentId || null },
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Category deactivated' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;