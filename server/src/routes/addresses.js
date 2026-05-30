import express from 'express';
import prisma from '../db/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });
    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to get addresses' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, address, city, state, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        address,
        city,
        state,
        postalCode,
        country: country || 'MY',
        isDefault: isDefault || false,
      },
    });

    res.json(newAddress);
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, state, postalCode, country, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        city,
        state,
        postalCode,
        country: country || 'MY',
        isDefault: isDefault || false,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id },
    });

    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;